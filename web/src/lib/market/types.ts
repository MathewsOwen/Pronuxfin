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

/** Agregado para UI: live = fontes reais; simulated = demo explícita; degraded = sem cotações. */
export type MarketDataMode = "live" | "simulated" | "degraded";

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
  dataMode?: MarketDataMode;
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

/** Retorno aproximado por ano civil a partir da série de fechamentos (primeiro vs último pregão do ano na janela). */
export type CalendarYearReturn = {
  year: number;
  returnPct: number;
};

/** Volume agregado por ano civil na janela (soma dos volumes diários quando existirem). */
export type CalendarYearVolume = {
  year: number;
  totalVolume: number;
};

/** Evento de provento (dividendo, JCP, rendimento). */
export type AssetDividendEvent = {
  paymentDate: string | null;
  exDate: string | null;
  recordDate: string | null;
  amount: number;
  type: string;
  label?: string;
};

/** Histórico e leituras de dividendos no dossiê. */
export type AssetDividendInsights = {
  sourceLabel: string;
  events: AssetDividendEvent[];
  trailing12mTotal: number | null;
  trailing12mYield: number | null;
  paymentsLast12m: number;
  paymentsLast24m: number;
  byYear: Array<{ year: number; total: number; count: number }>;
  nextPayment: AssetDividendEvent | null;
  dividendYieldSnapshot: number | null;
};

/** Retornos e risco derivados da série de pregões carregada no dossiê. */
export type AssetDossierPeriodStats = {
  ytd: number | null;
  oneMonth: number | null;
  threeMonths: number | null;
  sixMonths: number | null;
  oneYear: number | null;
  threeYears: number | null;
  fiveYears: number | null;
  sinceWindowStart: number | null;
  maxDrawdownPct: number | null;
  annualizedVolatilityPct: number | null;
  avgVolume20d: number | null;
  distanceFrom52WeekHighPct: number | null;
  distanceFrom52WeekLowPct: number | null;
  windowTradingDays: number;
};

/** Ratios e dividendos do snapshot de cotação (BRAPI / Yahoo) quando a fonte publica. */
export type AssetDossierMarketExtras = {
  beta: number | null;
  dividendYield: number | null;
  priceToBook: number | null;
  profitMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  debtToEquity: number | null;
  payoutRatio: number | null;
  trailingAnnualDividendRate: number | null;
  bookValuePerShare: number | null;
  enterpriseValue: number | null;
  forwardPe: number | null;
  pegRatio: number | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  ceoName?: string | null;
  fullTimeEmployees?: number | null;
  sourceLabel: string;
};

/** Leituras derivadas do histórico de cotações — não substituem demonstrações financeiras nem filings. */
export type AssetDossierHistoricalInsights = {
  /** Série curta para inferências multi-ano (ex.: só indicativa ou poucos anos). */
  historyDepthLimited: boolean;
  calendarYearReturns: CalendarYearReturn[];
  bestCalendarYear: CalendarYearReturn | null;
  worstCalendarYear: CalendarYearReturn | null;
  /** Anos civis com retorno negativo na janela (mais recentes primeiro). */
  negativeReturnYears: number[];
  topVolumeYears: CalendarYearVolume[];
  /** Alguns pregões sem volume na série. */
  volumeDataPartial: boolean;
};

/** Métricas TTM (trailing twelve months) via FMP — só preenchido para ativos internacionais quando a API devolve dados. */
export type IntlKeyMetricsTtm = {
  sourceLabel: string;
  dividendYield: number | null;
  peRatio: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  revenuePerShare: number | null;
  netIncomePerShare: number | null;
  operatingCashFlowPerShare: number | null;
  freeCashFlowPerShare: number | null;
  roe: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
};

/** Último exercício anual consolidado (FMP) — exterior. Valores como reportados pela fonte. */
export type IntlAnnualStatementsSnapshot = {
  sourceLabel: string;
  periodLabel: string | null;
  reportedCurrency: string | null;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalDebt: number | null;
  totalEquity: number | null;
  cashAndEquivalents: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  freeCashFlow: number | null;
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
  /** Exterior (FMP): CEO reportado no perfil, quando existir. */
  ceoName: string | null;
  /** Exterior (FMP): quadro aproximado de colaboradores, quando a fonte publicar. */
  fullTimeEmployees: number | null;
  /** Exterior: tickers de pares comparáveis (setor) — não são filiais nem grupo econômico. */
  intlStockPeers: string[] | null;
  /** Pares do mesmo setor na mesa PRONUX + feed externo (quando existir). */
  comparablePeers: string[];
  /** Ratios do snapshot de mercado (beta, margens, dividendos, etc.). */
  marketExtras: AssetDossierMarketExtras;
  /** Retornos por horizonte, drawdown e volatilidade na janela de histórico. */
  periodStats: AssetDossierPeriodStats;
  /** Histórico de proventos e yield derivado (BRAPI / FMP). */
  dividends: AssetDividendInsights;
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
  /** Exterior: métricas TTM (FMP) quando configurado — complementa Yahoo no dossiê. */
  intlKeyMetricsTtm: IntlKeyMetricsTtm | null;
  /** Exterior: último ano fiscal reportado (DRE / balanço / fluxo) via FMP quando disponível. */
  intlAnnualStatements: IntlAnnualStatementsSnapshot | null;
  /** Retornos e volumes por ano civil derivados do histórico carregado. */
  historicalInsights: AssetDossierHistoricalInsights;
};
