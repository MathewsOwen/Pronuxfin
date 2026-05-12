import { NextResponse, type NextRequest } from "next/server";
import { loadCryptoSectorQuotesPayload } from "@/lib/market/load-crypto-sector-quotes";
import {
  CRYPTO_SECTOR_ORDER,
  isCryptoSectorId,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Livro ao vivo por setor de cripto: `sector=layer1|defi|meme|…`. */
export async function GET(req: NextRequest) {
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
