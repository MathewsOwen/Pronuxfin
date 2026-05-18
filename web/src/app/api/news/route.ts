import { NextResponse } from "next/server";
import { fetchAggregatedNewsWithDiagnostics } from "@/lib/market/fetch-news";
import { loadCachedAggregatedNews } from "@/lib/market/market-data-gateway";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

export const runtime = "nodejs";

/** A rota continua dinâmica, mas agora usa cache TTL interno para aliviar os feeds. */
export const dynamic = "force-dynamic";

const NEWS_WINDOW_MS = 60_000;
const NEWS_MAX_PER_WINDOW = 40;

export async function GET() {
  const limited = await rateLimitResponse("news", NEWS_MAX_PER_WINDOW, NEWS_WINDOW_MS);
  if (limited) return limited;

  try {
    let articles = await loadCachedAggregatedNews(80);
    let feedsAttempted: number | undefined;
    let feedsSucceeded: number | undefined;
    let hint: string | undefined;

    if (articles.length === 0) {
      const diag = await fetchAggregatedNewsWithDiagnostics(80);
      articles = diag.articles;
      feedsAttempted = diag.feedsAttempted;
      feedsSucceeded = diag.feedsSucceeded;
      if (articles.length === 0) {
        hint =
          diag.feedsSucceeded === 0
            ? "Nenhum feed RSS respondeu no momento."
            : "Feeds responderam, mas não há manchetes novas.";
      }
    }

    const res = NextResponse.json({
      ok: true,
      fetchedAt: Date.now(),
      count: articles.length,
      articles,
      ...(feedsAttempted != null ? { feedsAttempted, feedsSucceeded } : {}),
      ...(hint ? { message: hint } : {}),
    });
    res.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    return res;
  } catch {
    const res = NextResponse.json(
      {
        ok: false,
        fetchedAt: Date.now(),
        count: 0,
        articles: [],
        message: "Não foi possível atualizar os feeds no momento.",
      },
      { status: 200 },
    );
    res.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    return res;
  }
}
