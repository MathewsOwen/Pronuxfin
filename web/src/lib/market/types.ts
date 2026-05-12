export type NewsArticle = {
  id: string;
  title: string;
  link: string;
  source: string;
  summary: string;
  publishedAt: string | null;
  /** Cobertura editorial agregada — UI pode diferenciar Brasil vs. mundo. */
  region?: "br" | "global";
};

export type QuoteSnapshot = {
  symbol: string;
  shortName?: string;
  currency?: string;
  regularMarketPrice: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  regularMarketVolume?: number | null;
  imageUrl?: string;
  marketCapRank?: number | null;
  marketTime?: string;
  segment?: "equity" | "crypto";
};

export type QuotesPayload = {
  fetchedAt: number;
  results: QuoteSnapshot[];
  /** Criptoativos em BRL — fonte CoinGecko quando disponível. */
  crypto?: QuoteSnapshot[];
  simulated?: boolean;
  cryptoSimulated?: boolean;
  cryptoPartial?: boolean;
  /** Algumas linhas da lista canonical não vieram na última rodada BRAPI. */
  equitiesPartial?: boolean;
};

export type EquityMarketRegion = "br" | "intl";

/** Livro por setor (Brasil BRAPI ou internacional Yahoo no servidor). */
export type SectorBookPayload = {
  fetchedAt: number;
  region: EquityMarketRegion;
  sector: string;
  universeCount: number;
  /** Camada upstream usada apenas para selo/atribuição de fonte na UI. */
  source: "brapi" | "yahoo";
  results: QuoteSnapshot[];
  simulated: boolean;
  partial: boolean;
};

export type CryptoSectorBookPayload = {
  fetchedAt: number;
  sector: string;
  universeCount: number;
  source: "coingecko";
  results: QuoteSnapshot[];
  simulated: boolean;
  partial: boolean;
};

export type AssetHistoryPoint = {
  date: string;
  close: number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
};

export type AssetMoveSnapshot = {
  date: string;
  percent: number;
  close: number;
};

export type AssetDossier = {
  symbol: string;
  region: EquityMarketRegion;
  historyMode: "live" | "indicative";
  quote: QuoteSnapshot;
  companyName: string;
  currency: string;
  foundedYear: number | null;
  headquarters: string | null;
  country: string | null;
  exchange: string | null;
  website: string | null;
  ipoDate: string | null;
  sector: string | null;
  industry: string | null;
  summary: string;
  keywords: string[];
  sourceLabel: string;
  marketCap: number | null;
  regularMarketVolume: number | null;
  regularMarketOpen: number | null;
  regularMarketPreviousClose: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  history: AssetHistoryPoint[];
  bestMove: AssetMoveSnapshot | null;
  worstMove: AssetMoveSnapshot | null;
  relatedNews: NewsArticle[];
};
