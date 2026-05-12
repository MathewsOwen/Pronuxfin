import type { QuoteSnapshot } from "./types";

/** ETFs índice usados como proxies visuais institucionais — não substituem benchmarks ou índices oficiais de referência. */
export const INDEX_PROXY_TICKERS = ["BOVA11", "IFIX11", "SMAL11"] as const;

export const INDEX_PROXY_LABELS: Record<string, string> = {
  BOVA11: "Ibovespa (proxy)",
  IFIX11: "FIIs · IFIX (proxy)",
  SMAL11: "Small caps (proxy)",
};

const BLUE_CHIP_TICKERS = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "ABEV3",
  "WEGE3",
  "MGLU3",
  "BBAS3",
  "BPAC11",
  "ITSA4",
  "SUZB3",
  "RENT3",
  "PRIO3",
  "RADL3",
  "LREN3",
  "BBSE3",
  "TIMS3",
  "SBSP3",
  "NTCO3",
  "CVCB3",
  "BRFS3",
  "VIVT3",
  "TOTS3",
  "RRRP3",
  "ASAI3",
  "SANB11",
  "MULT3",
  "ELET3",
  "CPFE3",
  "EQTL3",
  "EGIE3",
  "HAPV3",
  "FLRY3",
  "QUAL3",
  "JBSS3",
  "GGBR4",
  "CSNA3",
  "MRFG3",
  "SMTO3",
  "COGN3",
  "AZUL4",
  "GOLL4",
  "RAIL3",
  "EMBR3",
  "CSAN3",
  "BPAN4",
  "CXSE3",
  "ENEV3",
  "NEOE3",
  "BBDC3",
  "ITUB3",
  "ABCB4",
  "BRSR6",
  "SOMA3",
  "ARZZ3",
  "PETZ3",
] as const;

/** Ordem canônica na API e na mesa (proxies de índice primeiro). */
export const QUOTE_TICKERS = [...INDEX_PROXY_TICKERS, ...BLUE_CHIP_TICKERS] as const;

const QUOTE_ORDER_SET = new Set<string>(QUOTE_TICKERS);

export function sortQuotesForDesk(results: QuoteSnapshot[]): QuoteSnapshot[] {
  const bySym = new Map(results.map((r) => [r.symbol, r]));
  const ordered: QuoteSnapshot[] = [];
  for (const s of QUOTE_TICKERS) {
    const row = bySym.get(s);
    if (row) ordered.push(row);
  }
  for (const r of results) {
    if (!QUOTE_ORDER_SET.has(r.symbol)) ordered.push(r);
  }
  return ordered;
}
