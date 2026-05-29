import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import {
  CORE_CRYPTO_ASSETS,
  listCryptoSectorAssets,
  type CryptoAssetMeta,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import type { QuoteSnapshot } from "./types";

type CoinGeckoMarketRow = {
  id: string;
  symbol?: string;
  name?: string;
  image?: string;
  current_price?: number;
  total_volume?: number;
  market_cap_rank?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  last_updated?: string;
};

const COINGECKO_CHUNK_SIZE = 25;

function chunkAssets<T>(rows: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    out.push(rows.slice(i, i + size) as T[]);
  }
  return out;
}

function simulatedCryptoQuotesForAssets(assets: readonly CryptoAssetMeta[]): QuoteSnapshot[] {
  const t = Date.now() / 9500;
  return assets.map(({ symbol, shortName }, i) => {
    const seed = [...symbol].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const wave = Math.cos(t + i * 0.85);
    const pct = Number((wave * 3.1).toFixed(2));
    const base = 120 + (seed % 9_500);
    const multiplier = [1.3, 6.5, 24, 95, 420, 1_950][seed % 6] ?? 24;
    const price = Number((base * multiplier + wave * multiplier * 6.5).toFixed(2));
    const prev = price / (1 + pct / 100);
    const change = Number((price - prev).toFixed(2));
    return {
      symbol,
      shortName,
      currency: "BRL",
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: pct,
      regularMarketVolume: Number((price * (9_000 + (seed % 40_000))).toFixed(0)),
      marketCapRank: i + 1,
      segment: "crypto",
    } satisfies QuoteSnapshot;
  });
}

async function fetchCoinGeckoQuotesBrlForAssets(
  assets: readonly CryptoAssetMeta[],
): Promise<{ rows: QuoteSnapshot[]; partial: boolean }> {
  const attempt = async () => {
    let partial = false;
    let successfulChunks = 0;
    const data = new Map<string, CoinGeckoMarketRow>();
    const batches = chunkAssets(assets, COINGECKO_CHUNK_SIZE);

    const settled = await Promise.allSettled(
      batches.map(async (batch) => {
        const ids = batch.map((c) => c.id).join(",");
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&sparkline=false&price_change_percentage=24h`;
        const res = await fetchMarket(url, {
          headers: {
            Accept: "application/json",
            "User-Agent":
              "PRONUXFIN/1.0 (+https://pronuxfin.com.br; agrega cotações públicas CoinGecko)",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`coingecko_status_${res.status}`);
        }

        return (await res.json()) as CoinGeckoMarketRow[];
      }),
    );

    for (const result of settled) {
      if (result.status !== "fulfilled") {
        partial = true;
        continue;
      }
      successfulChunks += 1;
      for (const row of result.value) {
        if (typeof row.id === "string" && row.id.length > 0) {
          data.set(row.id, row);
        }
      }
    }

    if (successfulChunks === 0) {
      throw new Error("coingecko_all_chunks_failed");
    }

    const out: QuoteSnapshot[] = [];

    for (const { id, symbol, shortName } of assets) {
      const row = data.get(id);
      const price = typeof row?.current_price === "number" ? row.current_price : null;
      const pct =
        typeof row?.price_change_percentage_24h === "number"
          ? row.price_change_percentage_24h
          : null;
      if (price == null || pct == null) partial = true;
      let change: number | null = null;
      if (
        price != null &&
        pct != null &&
        Number.isFinite(price) &&
        Number.isFinite(pct)
      ) {
        const prevClose = price / (1 + pct / 100);
        change = Number((price - prevClose).toFixed(2));
      }

      out.push({
        symbol,
        shortName: typeof row?.name === "string" ? row.name : shortName,
        currency: "BRL",
        regularMarketPrice: price,
        regularMarketChange: change,
        regularMarketChangePercent: pct,
        regularMarketVolume:
          typeof row?.total_volume === "number" ? row.total_volume : null,
        imageUrl: typeof row?.image === "string" ? row.image : undefined,
        marketCapRank:
          typeof row?.market_cap_rank === "number" ? row.market_cap_rank : null,
        marketTime: typeof row?.last_updated === "string" ? row.last_updated : undefined,
        segment: "crypto",
      });
    }

    return { rows: out, partial };
  };

  try {
    return await attempt();
  } catch {
    await new Promise((r) => setTimeout(r, 400));
    return await attempt();
  }
}

export function simulatedCryptoQuotes(): QuoteSnapshot[] {
  return simulatedCryptoQuotesForAssets(CORE_CRYPTO_ASSETS);
}

export async function fetchCryptoQuotesBrl(): Promise<{
  rows: QuoteSnapshot[];
  partial: boolean;
}> {
  return fetchCoinGeckoQuotesBrlForAssets(CORE_CRYPTO_ASSETS);
}

export function simulatedCryptoSectorQuotes(sector: CryptoSectorId): QuoteSnapshot[] {
  return simulatedCryptoQuotesForAssets(listCryptoSectorAssets(sector));
}

export async function fetchCryptoSectorQuotesBrl(sector: CryptoSectorId): Promise<{
  rows: QuoteSnapshot[];
  partial: boolean;
}> {
  return fetchCoinGeckoQuotesBrlForAssets(listCryptoSectorAssets(sector));
}
