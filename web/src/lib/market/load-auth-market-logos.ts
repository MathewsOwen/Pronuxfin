import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { fetchBrapiQuotesForSymbols } from "@/lib/market/equities-brapi";
import {
  ALL_AUTH_MARKET_BR_SYMBOLS,
  AUTH_MARKET_CRYPTO,
  AUTH_MARKET_INTL,
  INTL_DISPLAY_NAMES,
  brapiIconFallbackUrl,
  categorizeBrSymbol,
  fmpStockLogoUrl,
} from "@/lib/market/auth-market-logo-universe";
import type { AuthMarketLogo } from "@/lib/market/auth-market-logo-types";

export type { AuthMarketLogo } from "@/lib/market/auth-market-logo-types";

type CoinGeckoLogoRow = {
  id?: string;
  symbol?: string;
  name?: string;
  image?: string;
};

async function fetchCryptoLogos(): Promise<AuthMarketLogo[]> {
  const ids = AUTH_MARKET_CRYPTO.map((c) => c.id).join(",");
  const url =
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl` +
    `&ids=${encodeURIComponent(ids)}&sparkline=false&price_change_percentage=24h`;

  try {
    const res = await fetchMarket(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as CoinGeckoLogoRow[];
    const byId = new Map(rows.filter((r) => r.id).map((r) => [r.id!, r]));

    return AUTH_MARKET_CRYPTO.flatMap(({ id, symbol }) => {
      const row = byId.get(id);
      const imageUrl = typeof row?.image === "string" ? row.image : null;
      if (!imageUrl) return [];
      return [
        {
          symbol,
          shortName: typeof row?.name === "string" ? row.name : symbol,
          imageUrl,
          category: "crypto" as const,
        },
      ];
    });
  } catch {
    return [];
  }
}

async function fetchBrLogos(): Promise<AuthMarketLogo[]> {
  const symbols = [...ALL_AUTH_MARKET_BR_SYMBOLS];
  const book = await fetchBrapiQuotesForSymbols(symbols, { sortOrder: symbols });

  const fromApi = new Map(
    book.rows
      .filter((row) => row.imageUrl || row.symbol)
      .map((row) => [row.symbol, row] as const),
  );

  return symbols.flatMap((symbol) => {
    const row = fromApi.get(symbol);
    const imageUrl = row?.imageUrl ?? brapiIconFallbackUrl(symbol);
    return [
      {
        symbol,
        shortName: row?.shortName,
        imageUrl,
        category: categorizeBrSymbol(symbol),
      },
    ];
  });
}

function intlLogos(): AuthMarketLogo[] {
  return AUTH_MARKET_INTL.map((symbol) => ({
    symbol,
    shortName: INTL_DISPLAY_NAMES[symbol] ?? symbol,
    imageUrl: fmpStockLogoUrl(symbol),
    category: "intl" as const,
  }));
}

/** Logos reais para o cenário de auth — BRAPI + CoinGecko + FMP. */
export async function loadAuthMarketLogos(): Promise<AuthMarketLogo[]> {
  const [br, crypto] = await Promise.all([fetchBrLogos(), fetchCryptoLogos()]);
  const intl = intlLogos();

  const order = new Map<string, number>();
  let i = 0;
  for (const logo of [...br, ...intl, ...crypto]) {
    if (!order.has(logo.symbol)) order.set(logo.symbol, i++);
  }

  return [...br, ...intl, ...crypto].sort(
    (a, b) => (order.get(a.symbol) ?? 0) - (order.get(b.symbol) ?? 0),
  );
}
