import {
  CORE_CRYPTO_ASSETS,
  CRYPTO_SECTOR_ORDER,
  listCryptoSectorAssets,
  type CryptoAssetMeta,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";

let symbolIndex: Map<string, CryptoAssetMeta> | null = null;

function buildSymbolIndex(): Map<string, CryptoAssetMeta> {
  if (symbolIndex) return symbolIndex;
  const map = new Map<string, CryptoAssetMeta>();
  const add = (asset: CryptoAssetMeta) => {
    const key = asset.symbol.trim().toUpperCase();
    if (!key || map.has(key)) return;
    map.set(key, asset);
  };
  for (const asset of CORE_CRYPTO_ASSETS) add(asset);
  for (const sector of CRYPTO_SECTOR_ORDER) {
    for (const asset of listCryptoSectorAssets(sector)) add(asset);
  }
  symbolIndex = map;
  return map;
}

export function listAllKnownCryptoAssets(): CryptoAssetMeta[] {
  return [...buildSymbolIndex().values()];
}

export function findCryptoAssetBySymbol(symbol: string): CryptoAssetMeta | null {
  const key = symbol.trim().toUpperCase();
  if (!key) return null;
  return buildSymbolIndex().get(key) ?? null;
}

export function isKnownCryptoSymbol(symbol: string): boolean {
  return findCryptoAssetBySymbol(symbol) != null;
}

export function inferCryptoSectorId(symbol: string): CryptoSectorId | null {
  const upper = symbol.trim().toUpperCase();
  for (const sector of CRYPTO_SECTOR_ORDER) {
    if (listCryptoSectorAssets(sector).some((a) => a.symbol === upper)) return sector;
  }
  return null;
}

export function listCryptoSectorPeers(symbol: string, limit = 14): string[] {
  const sector = inferCryptoSectorId(symbol);
  if (!sector) return [];
  const upper = symbol.trim().toUpperCase();
  return listCryptoSectorAssets(sector)
    .map((a) => a.symbol)
    .filter((s) => s !== upper)
    .slice(0, limit);
}
