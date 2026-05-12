import { NextResponse } from "next/server";
import { loadCachedAggregatedNews } from "@/lib/market/market-data-gateway";

export const runtime = "nodejs";

/** A rota continua dinâmica, mas agora usa cache TTL interno para aliviar os feeds. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await loadCachedAggregatedNews(80);
    const res = NextResponse.json({
      ok: true,
      fetchedAt: Date.now(),
      count: articles.length,
      articles,
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
