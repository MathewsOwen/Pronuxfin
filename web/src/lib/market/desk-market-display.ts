import { detectDeskMarketFromSymbol } from "@/lib/market/asset-class";
import {
  DESK_MARKET_META,
  type DeskMarketId,
  type WorldMarketMeta,
} from "@/lib/market/world-markets";

export function deskMarketMetaForSymbol(symbol: string): WorldMarketMeta {
  const market = detectDeskMarketFromSymbol(symbol);
  return DESK_MARKET_META[market];
}

export function deskMarketIdForSymbol(symbol: string): DeskMarketId {
  return detectDeskMarketFromSymbol(symbol);
}
