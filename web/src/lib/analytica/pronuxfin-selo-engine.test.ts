import { describe, expect, it } from "vitest";

import { analyzeDossier } from "@/lib/analytica/map-dossier-to-analytica";
import {
  computeCryptoSelo,
  computeEquitySelo,
} from "@/lib/analytica/pronuxfin-selo-engine";
import { enrichAssetDossier } from "@/lib/market/asset-dossier-enrichment";
import type { AssetDossier } from "@/lib/market/types";

function baseEquityDossier(overrides: Partial<AssetDossier> = {}): AssetDossier {
  return {
    symbol: "TEST4",
    assetClass: "equity",
    deskMarket: "br",
    region: "br",
    historyMode: "live",
    quote: {
      symbol: "TEST4",
      regularMarketPrice: 30,
      regularMarketChange: 0.5,
      regularMarketChangePercent: 1.5,
    },
    companyName: "Test SA",
    currency: "BRL",
    foundedYear: 1990,
    headquarters: "São Paulo, BR",
    country: "Brazil",
    exchange: "B3",
    website: "https://example.com",
    ipoDate: "2010-01-01",
    sector: "Utilities",
    industry: "Electric",
    ceoName: "CEO",
    fullTimeEmployees: 8000,
    intlStockPeers: null,
    comparablePeers: [],
    marketExtras: {
      beta: 0.8,
      dividendYield: 0.06,
      priceToBook: 1.2,
      profitMargin: 0.14,
      returnOnEquity: 0.18,
      returnOnAssets: 0.08,
      debtToEquity: 0.9,
      payoutRatio: 0.5,
      trailingAnnualDividendRate: 1.2,
      bookValuePerShare: 20,
      enterpriseValue: 50_000_000_000,
      forwardPe: 12,
      pegRatio: 1.1,
      sharesOutstanding: 1_000_000_000,
      floatShares: 800_000_000,
      sourceLabel: "BRAPI",
    },
    periodStats: {
      ytd: 8,
      oneMonth: 2,
      threeMonths: 5,
      sixMonths: 7,
      oneYear: 12,
      threeYears: 35,
      fiveYears: 60,
      sinceWindowStart: 60,
      maxDrawdownPct: -22,
      annualizedVolatilityPct: 18,
      avgVolume20d: 1_000_000,
      distanceFrom52WeekHighPct: -8,
      distanceFrom52WeekLowPct: 25,
      windowTradingDays: 1200,
    },
    dividends: {
      sourceLabel: "BRAPI",
      events: [],
      trailing12mTotal: 1.2,
      trailing12mYield: 0.04,
      paymentsLast12m: 4,
      paymentsLast24m: 8,
      byYear: [],
      yieldByYear: [],
      nextPayment: null,
      dividendYieldSnapshot: 0.04,
    },
    summary: "Test company",
    keywords: ["test"],
    sourceLabel: "BRAPI",
    marketCap: 30_000_000_000,
    regularMarketVolume: 2_000_000,
    regularMarketOpen: 29.5,
    regularMarketPreviousClose: 29.5,
    regularMarketDayHigh: 30.2,
    regularMarketDayLow: 29.1,
    fiftyTwoWeekHigh: 32,
    fiftyTwoWeekLow: 24,
    priceEarnings: 11,
    earningsPerShare: 2.7,
    history: [],
    bestMove: null,
    worstMove: null,
    relatedNews: [],
    intlKeyMetricsTtm: {
      sourceLabel: "FMP",
      dividendYield: 0.04,
      peRatio: 11,
      marketCap: 30_000_000_000,
      enterpriseValue: 50_000_000_000,
      revenuePerShare: 18,
      netIncomePerShare: 2.7,
      operatingCashFlowPerShare: 4,
      freeCashFlowPerShare: 3,
      roe: 0.18,
      debtToEquity: 0.9,
      currentRatio: 1.4,
    },
    intlAnnualStatements: {
      sourceLabel: "FMP",
      periodLabel: "2024",
      reportedCurrency: "BRL",
      revenue: 18_000_000_000,
      grossProfit: 8_000_000_000,
      operatingIncome: 4_000_000_000,
      netIncome: 3_000_000_000,
      totalAssets: 40_000_000_000,
      totalDebt: 10_000_000_000,
      totalEquity: 20_000_000_000,
      cashAndEquivalents: 2_000_000_000,
      operatingCashFlow: 4_500_000_000,
      capex: -1_000_000_000,
      freeCashFlow: 3_500_000_000,
    },
    historicalInsights: {
      historyDepthLimited: false,
      calendarYearReturns: [
        { year: 2024, returnPct: 12 },
        { year: 2023, returnPct: 8 },
        { year: 2022, returnPct: 5 },
        { year: 2021, returnPct: 15 },
        { year: 2020, returnPct: 10 },
      ],
      bestCalendarYear: { year: 2021, returnPct: 15 },
      worstCalendarYear: { year: 2022, returnPct: 5 },
      negativeReturnYears: [],
      topVolumeYears: [],
      volumeDataPartial: false,
    },
    cryptoProfile: null,
    ...overrides,
  };
}

describe("pronuxfin-selo-engine", () => {
  it("grades strong equity highly", () => {
    const dossier = enrichAssetDossier(baseEquityDossier());
    const bundle = analyzeDossier(dossier);
    const selo = computeEquitySelo(dossier, bundle);
    expect(selo.grade).toBeGreaterThanOrEqual(4);
    expect(selo.dataConfidence.score).toBeGreaterThan(50);
  });

  it("grades distressed equity at 0", () => {
    const dossier = baseEquityDossier({
      marketExtras: {
        ...baseEquityDossier().marketExtras,
        profitMargin: -0.12,
        returnOnEquity: -0.2,
      },
      intlAnnualStatements: {
        ...baseEquityDossier().intlAnnualStatements!,
        netIncome: -500_000_000,
        freeCashFlow: -200_000_000,
      },
      historicalInsights: {
        ...baseEquityDossier().historicalInsights,
        calendarYearReturns: [
          { year: 2024, returnPct: -30 },
          { year: 2023, returnPct: -15 },
        ],
        negativeReturnYears: [2024, 2023],
      },
    });
    const bundle = analyzeDossier(dossier);
    const selo = computeEquitySelo(dossier, bundle);
    expect(selo.grade).toBe(0);
  });

  it("grades top crypto with high score", () => {
    const dossier: AssetDossier = {
      ...baseEquityDossier({ assetClass: "crypto", deskMarket: null, region: "intl" }),
      assetClass: "crypto",
      deskMarket: null,
      cryptoProfile: {
        coinGeckoId: "bitcoin",
        categories: ["Layer 1"],
        genesisDate: "2009-01-03",
        hashingAlgorithm: "SHA-256",
        homepageUrl: "https://bitcoin.org",
        blockchainUrls: [],
        githubUrl: "https://github.com/bitcoin",
        twitterFollowers: 6_000_000,
        redditSubscribers: 5_000_000,
        githubStars: 80_000,
        githubForks: 40_000,
        commitCount4Weeks: 42,
        circulatingSupply: 19_000_000,
        totalSupply: 21_000_000,
        maxSupply: 21_000_000,
        fullyDilutedValuation: 2_000_000_000_000,
        athPrice: 500_000,
        athDate: "2024-01-01",
        atlPrice: 1000,
        atlDate: "2015-01-01",
        priceChange7d: 2,
        priceChange30d: 8,
        priceChange1y: 45,
        marketCapRank: 1,
        cryptoSector: "layer1",
        sourceLabel: "CoinGecko",
      },
    };
    const selo = computeCryptoSelo(dossier);
    expect(selo.grade).toBeGreaterThanOrEqual(4);
    expect(selo.assetClass).toBe("crypto");
  });
});
