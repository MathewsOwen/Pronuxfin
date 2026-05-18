import Parser from "rss-parser";
import { NEWS_FEEDS } from "@/lib/market/news-feeds-config";
import type { NewsArticle } from "@/lib/market/types";

const FETCH_HEADERS = {
  "User-Agent":
    "PRONUXFIN/1.0 (+https://pronuxfin.com.br; agrega feeds públicos RSS)",
  Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
} as const;

const parser = new Parser({
  timeout: 12_000,
  headers: FETCH_HEADERS,
});

const FEED_TIMEOUT_MS = 12_000;

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
  const res = await fetch(toHttpsFeedUrl(url), {
    cache: "no-store",
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`feed_status_${res.status}`);
  }
  return res.text();
}

async function loadFeedArticles(
  url: string,
  source: string,
  region: NewsArticle["region"],
): Promise<NewsArticle[]> {
  const xml = await fetchFeedXml(url);
  const feed = await parser.parseString(xml);
  const items = feed.items ?? [];
  return items.map((item) => {
    const title = (item.title ?? "").trim();
    const link = (item.link ?? item.guid ?? "").toString().trim();
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
    } satisfies NewsArticle;
  });
}

export type NewsFetchDiagnostics = {
  articles: NewsArticle[];
  feedsAttempted: number;
  feedsSucceeded: number;
};

export async function fetchAggregatedNewsWithDiagnostics(
  limit = 72,
): Promise<NewsFetchDiagnostics> {
  const batches = await Promise.allSettled(
    NEWS_FEEDS.map(({ url, source, region }) =>
      loadFeedArticles(url, source, region),
    ),
  );

  const merged: NewsArticle[] = [];
  let feedsSucceeded = 0;
  for (const b of batches) {
    if (b.status === "fulfilled") {
      feedsSucceeded += 1;
      merged.push(...b.value);
    }
  }

  const seen = new Set<string>();
  const deduped: NewsArticle[] = [];
  for (const article of merged) {
    if (!article.title || article.link === "#") continue;
    const key = normalizeTitle(article.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(article);
  }

  deduped.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  return {
    articles: deduped.slice(0, limit),
    feedsAttempted: NEWS_FEEDS.length,
    feedsSucceeded,
  };
}

export async function fetchAggregatedNews(limit = 72): Promise<NewsArticle[]> {
  const { articles } = await fetchAggregatedNewsWithDiagnostics(limit);
  return articles;
}
