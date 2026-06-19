import type { DossierDataConfidence, DossierDataConfidenceTier } from "@/lib/analytica/selo-types";
import type { AssetDossier } from "@/lib/market/types";

function tierFromScore(score: number): DossierDataConfidenceTier {
  if (score >= 82) return "institutional";
  if (score >= 62) return "high";
  if (score >= 38) return "medium";
  return "low";
}

export function computeDossierDataConfidence(dossier: AssetDossier): DossierDataConfidence {
  let score = 0;
  const sources = new Set<string>();
  const verifiedFields: string[] = [];

  if (dossier.historyMode === "live") {
    score += 14;
    verifiedFields.push("liveHistory");
  }

  if (dossier.periodStats.windowTradingDays >= 200) {
    score += 8;
    verifiedFields.push("deepHistory");
  }

  if (dossier.quote.regularMarketPrice != null) {
    score += 6;
    verifiedFields.push("liveQuote");
  }

  if (dossier.assetClass === "equity") {
    if (dossier.deskMarket === "br") sources.add("BRAPI");
    else sources.add("Yahoo Finance");

    if (dossier.intlAnnualStatements?.netIncome != null) {
      score += 18;
      sources.add("FMP · demonstrações");
      verifiedFields.push("annualStatements");
    }

    if (dossier.intlKeyMetricsTtm) {
      score += 14;
      sources.add("FMP · TTM");
      verifiedFields.push("ttmMetrics");
    }

    if (dossier.marketExtras.profitMargin != null) {
      score += 8;
      verifiedFields.push("profitMargin");
    }

    if (dossier.marketExtras.returnOnEquity != null) {
      score += 6;
      verifiedFields.push("roe");
    }

    if (dossier.dividends.events.length > 0) {
      score += 8;
      verifiedFields.push("dividends");
    }

    if (dossier.intlAnnualStatements?.freeCashFlow != null) {
      score += 10;
      verifiedFields.push("freeCashFlow");
    }

    if (dossier.relatedNews.length >= 3) {
      score += 4;
      verifiedFields.push("newsContext");
    }
  } else {
    sources.add("CoinGecko");
    const cp = dossier.cryptoProfile;
    if (cp) {
      score += 22;
      verifiedFields.push("coinGeckoDetail");
    }
    if (cp?.marketCapRank != null) {
      score += 10;
      verifiedFields.push("marketRank");
    }
    if (cp?.circulatingSupply != null) {
      score += 8;
      verifiedFields.push("supply");
    }
    if (dossier.history.length >= 120) {
      score += 12;
      verifiedFields.push("priceHistory");
    }
    if (cp?.githubStars != null || cp?.commitCount4Weeks != null) {
      score += 8;
      verifiedFields.push("developerSignals");
    }
  }

  const clamped = Math.min(100, score);
  return {
    score: clamped,
    tier: tierFromScore(clamped),
    sources: [...sources],
    verifiedFields,
  };
}
