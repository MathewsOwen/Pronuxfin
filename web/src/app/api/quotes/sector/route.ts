import { NextResponse, type NextRequest } from "next/server";
import { loadSectorQuotesPayload } from "@/lib/market/load-sector-quotes";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";
import {
  type MarketRegionId,
  type SectorId,
  SECTOR_ORDER,
  isMarketRegionId,
  isSectorId,
} from "@/lib/market/sector-universe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Livro ao vivo por setor: `region=br|intl`, `sector=commodities|technology|…`. */
const SECTOR_WINDOW_MS = 60_000;
const SECTOR_MAX_PER_WINDOW = 48;

export async function GET(req: NextRequest) {
  const limited = await rateLimitResponse("quotes-sector", SECTOR_MAX_PER_WINDOW, SECTOR_WINDOW_MS);
  if (limited) return limited;

  const url = new URL(req.url);
  const regionRaw = url.searchParams.get("region")?.trim() ?? "br";
  const sectorRaw =
    url.searchParams.get("sector")?.trim() ?? (SECTOR_ORDER[0] as string);

  if (!isMarketRegionId(regionRaw) || !isSectorId(sectorRaw)) {
    return NextResponse.json(
      {
        error: "invalid_sector_params",
        allowedRegions: ["br", "intl"],
        allowedSectors: SECTOR_ORDER,
      },
      { status: 400 },
    );
  }

  const region = regionRaw as MarketRegionId;
  const sector = sectorRaw as SectorId;

  const { payload, warnings } = await loadSectorQuotesPayload(region, sector);

  const res = NextResponse.json(
    warnings.length ? { ...payload, warnings } : payload,
  );
  res.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  return res;
}
