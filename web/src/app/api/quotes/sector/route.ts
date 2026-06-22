import { NextResponse, type NextRequest } from "next/server";
import { applyMarketApiCacheHeaders } from "@/lib/http/market-api-cache";
import { loadSectorQuotesPayload } from "@/lib/market/load-sector-quotes";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";
import {
  type SectorId,
  SECTOR_ORDER,
  isSectorId,
} from "@/lib/market/sector-universe";
import {
  DESK_MARKET_ORDER,
  normalizeDeskMarketId,
} from "@/lib/market/world-markets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Livro ao vivo por setor: `market=br|us|jp|…`, `sector=commodities|technology|…`. `region` legado = `market`. */
const SECTOR_WINDOW_MS = 60_000;
const SECTOR_MAX_PER_WINDOW = 48;

export async function GET(req: NextRequest) {
  const limited = await rateLimitResponse("quotes-sector", SECTOR_MAX_PER_WINDOW, SECTOR_WINDOW_MS, {
    failClosed: false,
  });
  if (limited) return limited;

  const url = new URL(req.url);
  const marketRaw =
    url.searchParams.get("market")?.trim() ||
    url.searchParams.get("region")?.trim() ||
    "br";
  const sectorRaw =
    url.searchParams.get("sector")?.trim() ?? (SECTOR_ORDER[0] as string);

  const market = normalizeDeskMarketId(marketRaw);
  if (!market || !isSectorId(sectorRaw)) {
    return NextResponse.json(
      {
        error: "invalid_sector_params",
        allowedMarkets: DESK_MARKET_ORDER,
        allowedRegions: DESK_MARKET_ORDER,
        allowedSectors: SECTOR_ORDER,
      },
      { status: 400 },
    );
  }

  const sector = sectorRaw as SectorId;

  const { payload, warnings } = await loadSectorQuotesPayload(market, sector);

  const res = NextResponse.json(
    warnings.length ? { ...payload, warnings } : payload,
  );
  applyMarketApiCacheHeaders(res);
  return res;
}
