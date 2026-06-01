import Parser from "rss-parser";
import { FetchTimeoutError, fetchMarket } from "@/lib/http/fetch-with-timeout";
import { safeExternalUrl } from "@/lib/http/safe-external-url";
import {
  NEWS_FEEDS,
  type NewsFeedConfig,
} from "@/lib/market/news-feeds-config";
import type { NewsArticle } from "@/lib/market/types";

const FETCH_HEADERS = {
  "User-Agent":
    "PRONUXFIN/1.0 (+https://pronuxfin.com.br; agrega feeds públicos RSS)",
  Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
} as const;

const parser = new Parser({
  timeout: 12_000,
  headers: FETCH_HEADERS,
});

function slugId(title: string, link: string): string {
  const base = `${title}|${link}`.slice(0, 96);
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
  }
  return `n-${Math.abs(h).toString(36)}`;
}

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .slice(0, 120);
}

function toHttpsFeedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.toString();
  } catch {
    return url;
  }
}

async function fetchFeedXml(url: string): Promise<string> {
  if (!safeExternalUrl(url)) {
    throw new Error("blocked feed URL");
  }

  const retryable = new Set([400, 408, 429, 500, 502, 503, 504]);
  let lastStatus = 0;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetchMarket(toHttpsFeedUrl(url), {
      cache: "no-store",
      headers: FETCH_HEADERS,
    });
    lastStatus = res.status;
    if (res.status >= 300 && res.status < 400) {
      throw new Error("feed redirect blocked");
    }
    if (res.ok) return res.text();
    if (!retryable.has(res.status) || attempt === 1) {
      throw new Error(`feed_status_${res.status}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  throw new Error(`feed_status_${lastStatus}`);
}

function articleRegion(feed: NewsFeedConfig): NewsArticle["region"] {
  return feed.desk === "br" ? "br" : "global";
}

async function loadFeedArticles(feedConfig: NewsFeedConfig): Promise<NewsArticle[]> {
  const { url, source, desk, worldRegion } = feedConfig;
  const region = articleRegion(feedConfig);
  const xml = await fetchFeedXml(url);
  const parsed = await parser.parseString(xml);
  const items = parsed.items ?? [];
  return items.map((item) => {
    const title = (item.title ?? "").trim();
    const rawLink = (item.link ?? item.guid ?? "").toString().trim();
    const link = safeExternalUrl(rawLink) ?? "#";
    const rawDate = item.isoDate ?? item.pubDate ?? null;
    const summary = (item.contentSnippet ?? item.content ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280);

    return {
      id: slugId(title, link),
      title,
      link: link || "#",
      source,
      summary,
      publishedAt: rawDate,
      region,
      desk,
      worldRegion,
    } satisfies NewsArticle;
  });
}

export type NewsSourceStatus = {
  source: string;
  region: NewsArticle["region"];
  desk?: NewsArticle["desk"];
  worldRegion?: NewsArticle["worldRegion"];
  /** Feed responded with parseable RSS. */
  ok: boolean;
  /** Items returned by the feed (before global dedup). */
  count: number;
  /** Short reason when the feed failed (e.g. feed_status_403, timeout). */
  error?: string;
};

export type NewsFetchDiagnostics = {
  articles: NewsArticle[];
  feedsAttempted: number;
  feedsSucceeded: number;
  sources: NewsSourceStatus[];
};

function publishedAtMs(article: NewsArticle): number {
  return article.publishedAt ? new Date(article.publishedAt).getTime() : 0;
}

function feedErrorReason(reason: unknown): string {
  if (reason instanceof Error) {
    if (
      reason instanceof FetchTimeoutError ||
      reason.name === "TimeoutError" ||
      reason.name === "AbortError"
    ) {
      return "timeout";
    }
    return reason.message.slice(0, 80);
  }
  return "feed_error";
}

/**
 * Keeps each source represented instead of letting the most prolific feeds
 * crowd out the rest of the global top-N. Without this, a per-source tab can
 * be empty even though its feed worked, because the client filters a globally
 * recency-sorted slice. We reserve a per-source quota, then fill the remaining
 * slots by recency, and finally re-sort so the hero is still the newest item.
 */
function selectWithSourceQuota(
  articles: NewsArticle[],
  limit: number,
): NewsArticle[] {
  if (articles.length <= limit) return articles;

  const bySource = new Map<string, NewsArticle[]>();
  for (const a of articles) {
    const arr = bySource.get(a.source);
    if (arr) arr.push(a);
    else bySource.set(a.source, [a]);
  }

  const quota = Math.max(1, Math.ceil(limit / Math.max(bySource.size, 1)));
  const chosen: NewsArticle[] = [];
  const chosenIds = new Set<string>();

  for (const bucket of bySource.values()) {
    for (const a of bucket.slice(0, quota)) {
      if (!chosenIds.has(a.id)) {
        chosen.push(a);
        chosenIds.add(a.id);
      }
    }
  }

  for (const a of articles) {
    if (chosen.length >= limit) break;
    if (!chosenIds.has(a.id)) {
      chosen.push(a);
      chosenIds.add(a.id);
    }
  }

  chosen.sort((a, b) => publishedAtMs(b) - publishedAtMs(a));
  return chosen.slice(0, limit);
}

export async function fetchAggregatedNewsWithDiagnostics(
  limit = 72,
): Promise<NewsFetchDiagnostics> {
  const batches = await Promise.allSettled(
    NEWS_FEEDS.map((feed) => loadFeedArticles(feed)),
  );

  const merged: NewsArticle[] = [];
  const sources: NewsSourceStatus[] = [];
  let feedsSucceeded = 0;

  batches.forEach((b, i) => {
    const feed = NEWS_FEEDS[i]!;
    if (b.status === "fulfilled") {
      feedsSucceeded += 1;
      merged.push(...b.value);
      sources.push({
        source: feed.source,
        region: articleRegion(feed),
        desk: feed.desk,
        worldRegion: feed.worldRegion,
        ok: true,
        count: b.value.length,
      });
    } else {
      sources.push({
        source: feed.source,
        region: articleRegion(feed),
        desk: feed.desk,
        worldRegion: feed.worldRegion,
        ok: false,
        count: 0,
        error: feedErrorReason(b.reason),
      });
    }
  });

  const seen = new Set<string>();
  const deduped: NewsArticle[] = [];
  for (const article of merged) {
    if (!article.title || article.link === "#") continue;
    const key = normalizeTitle(article.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(article);
  }

  deduped.sort((a, b) => publishedAtMs(b) - publishedAtMs(a));

  return {
    articles: selectWithSourceQuota(deduped, limit),
    feedsAttempted: NEWS_FEEDS.length,
    feedsSucceeded,
    sources,
  };
}

export async function fetchAggregatedNews(limit = 72): Promise<NewsArticle[]> {
  const { articles } = await fetchAggregatedNewsWithDiagnostics(limit);
  return articles;
}
