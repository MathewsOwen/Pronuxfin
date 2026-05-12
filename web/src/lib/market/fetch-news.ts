import Parser from "rss-parser";
import { NEWS_FEEDS } from "@/lib/market/news-feeds-config";
import type { NewsArticle } from "@/lib/market/types";

const parser = new Parser({
  timeout: 14000,
  headers: {
    "User-Agent":
      "PRONUXFIN/1.0 (+https://pronuxfin.com.br; agrega feeds públicos RSS)",
    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
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

export async function fetchAggregatedNews(limit = 72): Promise<NewsArticle[]> {
  const batches = await Promise.allSettled(
    NEWS_FEEDS.map(async ({ url, source, region }) => {
      const feed = await parser.parseURL(url);
      const items = feed.items ?? [];
      return items.map((item) => {
        const title = (item.title ?? "").trim();
        const link = (item.link ?? item.guid ?? "").toString().trim();
        const rawDate = item.isoDate ?? item.pubDate ?? null;
        const summary = (
          item.contentSnippet ??
          item.content ??
          ""
        )
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
    }),
  );

  const merged: NewsArticle[] = [];
  for (const b of batches) {
    if (b.status === "fulfilled") merged.push(...b.value);
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

  return deduped.slice(0, limit);
}
