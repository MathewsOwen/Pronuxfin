import type { QuoteSnapshot } from "@/lib/market/types";

/** Ordenação estável segundo lista canónica do setor (BR ou internacional). */
export function sortQuotesByCanonicalOrder(
  rows: QuoteSnapshot[],
  canonical: readonly string[],
): QuoteSnapshot[] {
  const bySym = new Map(rows.map((r) => [r.symbol.toUpperCase(), r]));
  const orderSet = new Set(canonical.map((s) => s.toUpperCase()));
  const ordered: QuoteSnapshot[] = [];
  for (const s of canonical) {
    const row = bySym.get(s.toUpperCase());
    if (row) ordered.push(row);
  }
  for (const r of rows) {
    if (!orderSet.has(r.symbol.toUpperCase())) ordered.push(r);
  }
  return ordered;
}
