import { listAllKnownCryptoAssets } from "@/lib/market/crypto-coin-registry";
import type { GlobalAssetSearchHit } from "@/lib/market/global-asset-search-types";
import { DESK_MARKET_ORDER, DESK_MARKET_META } from "@/lib/market/world-markets";
import { SECTOR_ORDER, listSectorSymbols } from "@/lib/market/sector-universe";
import { detectDeskMarketFromSymbol } from "@/lib/market/asset-class";

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function scoreLocalHit(query: string, symbol: string, name?: string): number {
  const q = normalizeQuery(query);
  const sym = symbol.toLowerCase();
  const nm = name?.toLowerCase() ?? "";
  if (!q) return 0;
  if (sym === q) return 100;
  if (sym.startsWith(q)) return 80;
  if (nm === q) return 90;
  if (nm.startsWith(q)) return 70;
  if (nm.includes(q)) return 50;
  if (sym.includes(q)) return 40;
  return 0;
}

export function searchLocalUniverse(query: string, limit = 12): GlobalAssetSearchHit[] {
  const q = normalizeQuery(query);
  if (q.length < 1) return [];

  const scored: Array<{ hit: GlobalAssetSearchHit; score: number }> = [];

  for (const asset of listAllKnownCryptoAssets()) {
    const score = scoreLocalHit(q, asset.symbol, asset.shortName);
    if (score <= 0) continue;
    scored.push({
      score,
      hit: {
        symbol: asset.symbol,
        name: asset.shortName,
        assetClass: "crypto",
        deskMarket: null,
        exchangeLabel: "Crypto",
        countryCode: null,
        flag: "🪙",
        marketCapRank: null,
        source: "local",
      },
    });
  }

  for (const market of DESK_MARKET_ORDER) {
    const meta = DESK_MARKET_META[market];
    for (const sector of SECTOR_ORDER) {
      for (const symbol of listSectorSymbols(market, sector)) {
        const score = scoreLocalHit(q, symbol);
        if (score <= 0) continue;
        scored.push({
          score,
          hit: {
            symbol,
            name: symbol,
            assetClass: "equity",
            deskMarket: detectDeskMarketFromSymbol(symbol),
            exchangeLabel: meta.exchangeLabelEn,
            countryCode: meta.countryCode,
            flag: meta.flag,
            marketCapRank: null,
            source: "local",
          },
        });
      }
    }
  }

  const seen = new Set<string>();
  const out: GlobalAssetSearchHit[] = [];
  scored
    .sort((a, b) => b.score - a.score)
    .forEach(({ hit }) => {
      const key = `${hit.assetClass}:${hit.symbol}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(hit);
    });

  return out.slice(0, limit);
}
