import type { QuoteSnapshot } from "@/lib/market/types";

export function simulatedB3EquitiesForSymbols(
  symbolsInput: readonly string[],
): QuoteSnapshot[] {
  const symbols = [...new Set(symbolsInput.map((s) => s.trim().toUpperCase()))];
  const t = Date.now() / 8000;
  return symbols.map((symbol, i) => {
    const wave = Math.sin(t + i * 0.7);
    const pct = Number((wave * (1.2 + (i % 5) * 0.15)).toFixed(2));
    const price = Number((12 + (i % 9) * 3.17 + wave * 0.85).toFixed(2));
    const change = Number(((price * pct) / 100).toFixed(4));
    return {
      symbol,
      shortName: symbol,
      currency: "BRL",
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: pct,
      segment: "equity",
    } satisfies QuoteSnapshot;
  });
}

export function simulatedIntlEquitiesForSymbols(
  symbolsInput: readonly string[],
): QuoteSnapshot[] {
  const symbols = [...new Set(symbolsInput.map((s) => s.trim().toUpperCase()))];
  const t = Date.now() / 8500;
  return symbols.map((symbol, i) => {
    const wave = Math.sin(t + i * 0.61 + 12);
    const pct = Number((wave * (1.05 + (i % 7) * 0.12)).toFixed(2));
    const price = Number((28 + (i % 13) * 7.91 + wave * 1.2).toFixed(2));
    const change = Number(((price * pct) / 100).toFixed(4));
    return {
      symbol,
      shortName: symbol,
      currency: "USD",
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: pct,
      segment: "equity",
    } satisfies QuoteSnapshot;
  });
}
