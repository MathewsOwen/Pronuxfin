/**
 * Os 20 maiores mercados acionários do mundo (por capitalização / liquidez).
 * Brasil (B3) + 19 bolsas internacionais para a mesa ao vivo global.
 */

export const DESK_MARKET_ORDER = [
  "br",
  "us",
  "cn",
  "hk",
  "jp",
  "gb",
  "de",
  "fr",
  "in",
  "ca",
  "sa",
  "ch",
  "au",
  "kr",
  "nl",
  "tw",
  "se",
  "it",
  "es",
  "sg",
] as const;

export type DeskMarketId = (typeof DESK_MARKET_ORDER)[number];

export type WorldMarketMeta = {
  id: DeskMarketId;
  /** ISO 3166-1 alpha-2 (ou composto para HK/TW). */
  countryCode: string;
  flag: string;
  namePt: string;
  nameEn: string;
  /** Bolsa principal exibida na UI. */
  exchangeLabelPt: string;
  exchangeLabelEn: string;
  defaultCurrency: string;
  /** Sufixo Yahoo Finance típico (vazio = EUA). */
  yahooSuffix: string;
  /** Índice de referência (informativo). */
  benchmarkIndex: string;
  quoteSource: "brapi" | "yahoo";
};

export const DESK_MARKET_META: Record<DeskMarketId, WorldMarketMeta> = {
  br: {
    id: "br",
    countryCode: "BR",
    flag: "🇧🇷",
    namePt: "Brasil",
    nameEn: "Brazil",
    exchangeLabelPt: "B3",
    exchangeLabelEn: "B3",
    defaultCurrency: "BRL",
    yahooSuffix: "",
    benchmarkIndex: "Ibovespa",
    quoteSource: "brapi",
  },
  us: {
    id: "us",
    countryCode: "US",
    flag: "🇺🇸",
    namePt: "Estados Unidos",
    nameEn: "United States",
    exchangeLabelPt: "NYSE · Nasdaq",
    exchangeLabelEn: "NYSE · Nasdaq",
    defaultCurrency: "USD",
    yahooSuffix: "",
    benchmarkIndex: "S&P 500",
    quoteSource: "yahoo",
  },
  cn: {
    id: "cn",
    countryCode: "CN",
    flag: "🇨🇳",
    namePt: "China continental",
    nameEn: "Mainland China",
    exchangeLabelPt: "SSE · SZSE",
    exchangeLabelEn: "SSE · SZSE",
    defaultCurrency: "CNY",
    yahooSuffix: ".SS",
    benchmarkIndex: "CSI 300",
    quoteSource: "yahoo",
  },
  hk: {
    id: "hk",
    countryCode: "HK",
    flag: "🇭🇰",
    namePt: "Hong Kong",
    nameEn: "Hong Kong",
    exchangeLabelPt: "HKEX",
    exchangeLabelEn: "HKEX",
    defaultCurrency: "HKD",
    yahooSuffix: ".HK",
    benchmarkIndex: "Hang Seng",
    quoteSource: "yahoo",
  },
  jp: {
    id: "jp",
    countryCode: "JP",
    flag: "🇯🇵",
    namePt: "Japão",
    nameEn: "Japan",
    exchangeLabelPt: "TSE",
    exchangeLabelEn: "TSE",
    defaultCurrency: "JPY",
    yahooSuffix: ".T",
    benchmarkIndex: "Nikkei 225",
    quoteSource: "yahoo",
  },
  gb: {
    id: "gb",
    countryCode: "GB",
    flag: "🇬🇧",
    namePt: "Reino Unido",
    nameEn: "United Kingdom",
    exchangeLabelPt: "LSE",
    exchangeLabelEn: "LSE",
    defaultCurrency: "GBP",
    yahooSuffix: ".L",
    benchmarkIndex: "FTSE 100",
    quoteSource: "yahoo",
  },
  de: {
    id: "de",
    countryCode: "DE",
    flag: "🇩🇪",
    namePt: "Alemanha",
    nameEn: "Germany",
    exchangeLabelPt: "Xetra",
    exchangeLabelEn: "Xetra",
    defaultCurrency: "EUR",
    yahooSuffix: ".DE",
    benchmarkIndex: "DAX",
    quoteSource: "yahoo",
  },
  fr: {
    id: "fr",
    countryCode: "FR",
    flag: "🇫🇷",
    namePt: "França",
    nameEn: "France",
    exchangeLabelPt: "Euronext Paris",
    exchangeLabelEn: "Euronext Paris",
    defaultCurrency: "EUR",
    yahooSuffix: ".PA",
    benchmarkIndex: "CAC 40",
    quoteSource: "yahoo",
  },
  in: {
    id: "in",
    countryCode: "IN",
    flag: "🇮🇳",
    namePt: "Índia",
    nameEn: "India",
    exchangeLabelPt: "NSE",
    exchangeLabelEn: "NSE",
    defaultCurrency: "INR",
    yahooSuffix: ".NS",
    benchmarkIndex: "Nifty 50",
    quoteSource: "yahoo",
  },
  ca: {
    id: "ca",
    countryCode: "CA",
    flag: "🇨🇦",
    namePt: "Canadá",
    nameEn: "Canada",
    exchangeLabelPt: "TSX",
    exchangeLabelEn: "TSX",
    defaultCurrency: "CAD",
    yahooSuffix: ".TO",
    benchmarkIndex: "S&P/TSX",
    quoteSource: "yahoo",
  },
  sa: {
    id: "sa",
    countryCode: "SA",
    flag: "🇸🇦",
    namePt: "Arábia Saudita",
    nameEn: "Saudi Arabia",
    exchangeLabelPt: "Tadawul",
    exchangeLabelEn: "Tadawul",
    defaultCurrency: "SAR",
    yahooSuffix: ".SR",
    benchmarkIndex: "TASI",
    quoteSource: "yahoo",
  },
  ch: {
    id: "ch",
    countryCode: "CH",
    flag: "🇨🇭",
    namePt: "Suíça",
    nameEn: "Switzerland",
    exchangeLabelPt: "SIX",
    exchangeLabelEn: "SIX",
    defaultCurrency: "CHF",
    yahooSuffix: ".SW",
    benchmarkIndex: "SMI",
    quoteSource: "yahoo",
  },
  au: {
    id: "au",
    countryCode: "AU",
    flag: "🇦🇺",
    namePt: "Austrália",
    nameEn: "Australia",
    exchangeLabelPt: "ASX",
    exchangeLabelEn: "ASX",
    defaultCurrency: "AUD",
    yahooSuffix: ".AX",
    benchmarkIndex: "ASX 200",
    quoteSource: "yahoo",
  },
  kr: {
    id: "kr",
    countryCode: "KR",
    flag: "🇰🇷",
    namePt: "Coreia do Sul",
    nameEn: "South Korea",
    exchangeLabelPt: "KRX",
    exchangeLabelEn: "KRX",
    defaultCurrency: "KRW",
    yahooSuffix: ".KS",
    benchmarkIndex: "KOSPI",
    quoteSource: "yahoo",
  },
  nl: {
    id: "nl",
    countryCode: "NL",
    flag: "🇳🇱",
    namePt: "Países Baixos",
    nameEn: "Netherlands",
    exchangeLabelPt: "Euronext Amsterdam",
    exchangeLabelEn: "Euronext Amsterdam",
    defaultCurrency: "EUR",
    yahooSuffix: ".AS",
    benchmarkIndex: "AEX",
    quoteSource: "yahoo",
  },
  tw: {
    id: "tw",
    countryCode: "TW",
    flag: "🇹🇼",
    namePt: "Taiwan",
    nameEn: "Taiwan",
    exchangeLabelPt: "TWSE",
    exchangeLabelEn: "TWSE",
    defaultCurrency: "TWD",
    yahooSuffix: ".TW",
    benchmarkIndex: "TAIEX",
    quoteSource: "yahoo",
  },
  se: {
    id: "se",
    countryCode: "SE",
    flag: "🇸🇪",
    namePt: "Suécia",
    nameEn: "Sweden",
    exchangeLabelPt: "Nasdaq Stockholm",
    exchangeLabelEn: "Nasdaq Stockholm",
    defaultCurrency: "SEK",
    yahooSuffix: ".ST",
    benchmarkIndex: "OMX Stockholm 30",
    quoteSource: "yahoo",
  },
  it: {
    id: "it",
    countryCode: "IT",
    flag: "🇮🇹",
    namePt: "Itália",
    nameEn: "Italy",
    exchangeLabelPt: "Borsa Italiana",
    exchangeLabelEn: "Borsa Italiana",
    defaultCurrency: "EUR",
    yahooSuffix: ".MI",
    benchmarkIndex: "FTSE MIB",
    quoteSource: "yahoo",
  },
  es: {
    id: "es",
    countryCode: "ES",
    flag: "🇪🇸",
    namePt: "Espanha",
    nameEn: "Spain",
    exchangeLabelPt: "BME",
    exchangeLabelEn: "BME",
    defaultCurrency: "EUR",
    yahooSuffix: ".MC",
    benchmarkIndex: "IBEX 35",
    quoteSource: "yahoo",
  },
  sg: {
    id: "sg",
    countryCode: "SG",
    flag: "🇸🇬",
    namePt: "Singapura",
    nameEn: "Singapore",
    exchangeLabelPt: "SGX",
    exchangeLabelEn: "SGX",
    defaultCurrency: "SGD",
    yahooSuffix: ".SI",
    benchmarkIndex: "STI",
    quoteSource: "yahoo",
  },
};

/** Mercados internacionais (exclui Brasil). */
export const WORLD_DESK_MARKET_ORDER = DESK_MARKET_ORDER.filter(
  (id): id is Exclude<DeskMarketId, "br"> => id !== "br",
);

export function isDeskMarketId(value: string): value is DeskMarketId {
  return (DESK_MARKET_ORDER as readonly string[]).includes(value);
}

/** Aceita `intl` legado (mapeia para EUA). */
export function normalizeDeskMarketId(raw: string): DeskMarketId | null {
  const v = raw.trim().toLowerCase();
  if (v === "intl") return "us";
  return isDeskMarketId(v) ? v : null;
}

export function deskMarketUsesBrapi(market: DeskMarketId): boolean {
  return DESK_MARKET_META[market].quoteSource === "brapi";
}

export function deskMarketDefaultCurrency(market: DeskMarketId): string {
  return DESK_MARKET_META[market].defaultCurrency;
}
