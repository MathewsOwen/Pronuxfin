import {
  findCryptoAssetBySymbol,
  isKnownCryptoSymbol,
} from "@/lib/market/crypto-coin-registry";
import {
  DESK_MARKET_ORDER,
  type DeskMarketId,
  normalizeDeskMarketId,
} from "@/lib/market/world-markets";
import { SECTOR_ORDER, listSectorSymbols } from "@/lib/market/sector-universe";
import type { SectorId } from "@/lib/market/sector-universe";

export type AssetClass = "equity" | "crypto";

const YAHOO_SUFFIX_TO_MARKET: ReadonlyArray<[string, DeskMarketId]> = [
  [".SS", "cn"],
  [".SZ", "cn"],
  [".HK", "hk"],
  [".T", "jp"],
  [".L", "gb"],
  [".DE", "de"],
  [".PA", "fr"],
  [".NS", "in"],
  [".BO", "in"],
  [".TO", "ca"],
  [".SR", "sa"],
  [".SW", "ch"],
  [".AX", "au"],
  [".KS", "kr"],
  [".KQ", "kr"],
  [".AS", "nl"],
  [".TW", "tw"],
  [".ST", "se"],
  [".MI", "it"],
  [".MC", "es"],
  [".SI", "sg"],
];

export function detectAssetClass(symbol: string): AssetClass {
  if (isKnownCryptoSymbol(symbol)) return "crypto";
  return "equity";
}

/** B3: ticker termina em dígito sem sufixo de bolsa internacional (ex.: PETR4, AAPL34). */
export function detectDeskMarketFromSymbol(symbol: string): DeskMarketId {
  const upper = symbol.trim().toUpperCase();
  for (const [suffix, market] of YAHOO_SUFFIX_TO_MARKET) {
    if (upper.endsWith(suffix)) return market;
  }
  if (/\d$/.test(upper)) return "br";
  return "us";
}

export function detectEquityDeskMarket(symbol: string): DeskMarketId {
  return detectDeskMarketFromSymbol(symbol);
}

export function inferEquitySectorId(symbol: string): SectorId | null {
  const upper = symbol.trim().toUpperCase();
  for (const market of DESK_MARKET_ORDER) {
    for (const sector of SECTOR_ORDER) {
      if (listSectorSymbols(market, sector).includes(upper)) return sector;
    }
  }
  return null;
}

export function resolveLegacyEquityRegion(
  symbol: string,
): import("@/lib/market/types").EquityMarketRegion {
  const market = detectDeskMarketFromSymbol(symbol);
  return market === "br" ? "br" : market;
}

export function normalizeEquityDeskMarketInput(
  raw: string | DeskMarketId | "intl",
): DeskMarketId {
  return normalizeDeskMarketId(String(raw)) ?? detectDeskMarketFromSymbol(String(raw));
}

export function cryptoCoinIdForSymbol(symbol: string): string | null {
  return findCryptoAssetBySymbol(symbol)?.id ?? null;
}
