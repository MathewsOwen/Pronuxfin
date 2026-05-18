import { NextResponse, type NextRequest } from "next/server";
import { loadCryptoSectorQuotesPayload } from "@/lib/market/load-crypto-sector-quotes";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";
import {
  CRYPTO_SECTOR_ORDER,
  isCryptoSectorId,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Livro ao vivo por setor de cripto: `sector=layer1|defi|meme|…`. */
const CRYPTO_SECTOR_WINDOW_MS = 60_000;
const CRYPTO_SECTOR_MAX_PER_WINDOW = 48;

export async function GET(req: NextRequest) {
  const limited = await rateLimitResponse(
    "quotes-crypto-sector",
    CRYPTO_SECTOR_MAX_PER_WINDOW,
    CRYPTO_SECTOR_WINDOW_MS,
  );
  if (limited) return limited;

  const url = new URL(req.url);
  const sectorRaw =
    url.searchParams.get("sector")?.trim() ?? (CRYPTO_SECTOR_ORDER[0] as string);

  if (!isCryptoSectorId(sectorRaw)) {
    return NextResponse.json(
      {
        error: "invalid_crypto_sector_params",
        allowedSectors: CRYPTO_SECTOR_ORDER,
      },
      { status: 400 },
    );
  }

  const sector = sectorRaw as CryptoSectorId;
  const { payload, warnings } = await loadCryptoSectorQuotesPayload(sector);

  const res = NextResponse.json(
    warnings.length ? { ...payload, warnings } : payload,
  );
  res.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  return res;
}
