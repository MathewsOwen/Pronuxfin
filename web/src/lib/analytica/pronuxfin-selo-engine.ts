import { computeDossierDataConfidence } from "@/lib/analytica/dossier-data-confidence";
import type { AssetAnalysisBundle } from "@/lib/analytica/types";
import type {
  DossierSeloResult,
  SeloGrade,
  SeloPillar,
} from "@/lib/analytica/selo-types";
import type { AssetDossier } from "@/lib/market/types";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeRatio(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) > 1.5) return value / 100;
  return value;
}

function gradeFromComposite(score: number, hardZero: boolean): SeloGrade {
  if (hardZero || score < 12) return 0;
  if (score < 28) return 1;
  if (score < 46) return 2;
  if (score < 64) return 3;
  if (score < 80) return 4;
  return 5;
}

const GRADE_LABEL_KEYS: Record<SeloGrade, string> = {
  0: "grade0Label",
  1: "grade1Label",
  2: "grade2Label",
  3: "grade3Label",
  4: "grade4Label",
  5: "grade5Label",
};

const GRADE_SUMMARY_KEYS: Record<SeloGrade, string> = {
  0: "grade0Summary",
  1: "grade1Summary",
  2: "grade2Summary",
  3: "grade3Summary",
  4: "grade4Summary",
  5: "grade5Summary",
};

function equityHardDistress(dossier: AssetDossier, bundle: AssetAnalysisBundle): boolean {
  const margin =
    normalizeRatio(dossier.marketExtras.profitMargin) ??
    (dossier.intlAnnualStatements?.netIncome != null &&
    dossier.intlAnnualStatements.revenue != null &&
    dossier.intlAnnualStatements.revenue > 0
      ? dossier.intlAnnualStatements.netIncome / dossier.intlAnnualStatements.revenue
      : null);

  const ni = dossier.intlAnnualStatements?.netIncome;
  const fcf = dossier.intlAnnualStatements?.freeCashFlow;
  const years = bundle.quant.consecutiveProfitableYears;

  if (bundle.quantResult.isToxicBomb) return true;
  if (ni != null && ni < 0 && (margin == null || margin <= 0)) return true;
  if (years === 0 && (margin == null || margin <= 0)) return true;
  if (margin != null && margin < -0.05) return true;
  if (fcf != null && fcf < 0 && ni != null && ni < 0) return true;
  return false;
}

export function computeEquitySelo(
  dossier: AssetDossier,
  bundle: AssetAnalysisBundle,
): DossierSeloResult {
  const dataConfidence = computeDossierDataConfidence(dossier);
  const hardZero = equityHardDistress(dossier, bundle);
  const { quantResult, qualResult } = bundle;

  const margin = normalizeRatio(bundle.quant.netMargin) ?? 0;
  const roe = normalizeRatio(bundle.quant.roe) ?? 0;
  const cagr = bundle.quant.revenueCagr5y ?? 0;
  const years = bundle.quant.consecutiveProfitableYears;

  const pillars: SeloPillar[] = [
    {
      id: "profitability",
      labelKey: "pillarProfitability",
      score: clamp((margin + 0.05) * 200 + (roe * 120), 0, 100),
      maxScore: 100,
    },
    {
      id: "longevity",
      labelKey: "pillarLongevity",
      score: clamp(years * 18 + (quantResult.healthScore * 0.35), 0, 100),
      maxScore: 100,
    },
    {
      id: "growth",
      labelKey: "pillarGrowth",
      score: clamp(((cagr + 0.08) / 0.28) * 100, 0, 100),
      maxScore: 100,
    },
    {
      id: "balance",
      labelKey: "pillarBalance",
      score: clamp(quantResult.healthScore - quantResult.debtPenalty * 0.4, 0, 100),
      maxScore: 100,
    },
    {
      id: "qualitative",
      labelKey: "pillarQualitative",
      score: clamp(qualResult.qualitativeScore * 10, 0, 100),
      maxScore: 100,
    },
  ];

  const pillarAvg =
    pillars.reduce((sum, p) => sum + p.score, 0) / Math.max(pillars.length, 1);
  const compositeScore = hardZero
    ? 0
    : clamp(qualResult.pci * 0.55 + pillarAvg * 0.45, 0, 100);

  const grade = gradeFromComposite(compositeScore, hardZero);
  const rationaleKeys: string[] = [];

  if (hardZero) rationaleKeys.push("rationaleDistress");
  if (quantResult.debtPenalty > 8) rationaleKeys.push("rationaleHighDebt");
  if (years >= 5) rationaleKeys.push("rationaleProfitableStreak");
  if (margin >= 0.12) rationaleKeys.push("rationaleStrongMargin");
  if (qualResult.pci >= 75) rationaleKeys.push("rationaleElitePci");
  if (dataConfidence.tier === "institutional" || dataConfidence.tier === "high") {
    rationaleKeys.push("rationaleHighConfidence");
  }
  if (quantResult.riskClassification === "ELITE_COMPOUNDER") {
    rationaleKeys.push("rationaleEliteCompound");
  }

  return {
    grade,
    assetClass: "equity",
    compositeScore: Math.round(compositeScore * 10) / 10,
    labelKey: GRADE_LABEL_KEYS[grade],
    summaryKey: GRADE_SUMMARY_KEYS[grade],
    pillars,
    rationaleKeys,
    dataConfidence,
  };
}

function rankPoints(rank: number | null | undefined): number {
  if (rank == null || !Number.isFinite(rank)) return 8;
  if (rank <= 10) return 25;
  if (rank <= 30) return 22;
  if (rank <= 100) return 18;
  if (rank <= 250) return 12;
  if (rank <= 500) return 8;
  return 4;
}

function momentumPoints(change1y: number | null | undefined): number {
  if (change1y == null || !Number.isFinite(change1y)) return 8;
  if (change1y >= 80) return 20;
  if (change1y >= 25) return 17;
  if (change1y >= 0) return 14;
  if (change1y >= -25) return 10;
  if (change1y >= -55) return 5;
  return 2;
}

function riskPoints(maxDrawdown: number | null | undefined, volatility: number | null | undefined): number {
  let score = 12;
  if (maxDrawdown != null) {
    const dd = Math.abs(maxDrawdown);
    if (dd <= 35) score += 8;
    else if (dd <= 55) score += 5;
    else if (dd <= 75) score += 2;
  }
  if (volatility != null) {
    if (volatility <= 55) score += 5;
    else if (volatility <= 85) score += 3;
  }
  return clamp(score, 0, 20);
}

function ecosystemPoints(dossier: AssetDossier): number {
  const cp = dossier.cryptoProfile;
  if (!cp) return 5;
  let score = 0;
  if ((cp.githubStars ?? 0) > 500) score += 5;
  else if ((cp.githubStars ?? 0) > 100) score += 3;
  if ((cp.commitCount4Weeks ?? 0) > 20) score += 5;
  else if ((cp.commitCount4Weeks ?? 0) > 5) score += 3;
  if ((cp.twitterFollowers ?? 0) > 500_000) score += 4;
  else if ((cp.twitterFollowers ?? 0) > 50_000) score += 2;
  if ((cp.redditSubscribers ?? 0) > 100_000) score += 3;
  return clamp(score, 0, 15);
}

export function computeCryptoSelo(dossier: AssetDossier): DossierSeloResult {
  const dataConfidence = computeDossierDataConfidence(dossier);
  const cp = dossier.cryptoProfile;
  const stats = dossier.periodStats;

  const change1y = cp?.priceChange1y ?? stats.oneYear;
  const rankScore = rankPoints(cp?.marketCapRank);
  const momentumScore = momentumPoints(change1y);
  const riskScore = riskPoints(stats.maxDrawdownPct, stats.annualizedVolatilityPct);
  const ecosystemScore = ecosystemPoints(dossier);

  let recoveryScore = 8;
  const price = dossier.quote.regularMarketPrice;
  const ath = cp?.athPrice;
  if (price != null && ath != null && ath > 0) {
    const fromAth = (price / ath - 1) * 100;
    if (fromAth >= -25) recoveryScore = 15;
    else if (fromAth >= -50) recoveryScore = 12;
    else if (fromAth >= -75) recoveryScore = 8;
    else recoveryScore = 4;
  }

  const pillars: SeloPillar[] = [
    {
      id: "marketRank",
      labelKey: "pillarCryptoRank",
      score: rankScore * 4,
      maxScore: 100,
    },
    {
      id: "momentum",
      labelKey: "pillarCryptoMomentum",
      score: momentumScore * 5,
      maxScore: 100,
    },
    {
      id: "risk",
      labelKey: "pillarCryptoRisk",
      score: riskScore * 5,
      maxScore: 100,
    },
    {
      id: "ecosystem",
      labelKey: "pillarCryptoEcosystem",
      score: ecosystemScore * (100 / 15),
      maxScore: 100,
    },
    {
      id: "recovery",
      labelKey: "pillarCryptoRecovery",
      score: recoveryScore * (100 / 15),
      maxScore: 100,
    },
  ];

  const raw =
    rankScore + momentumScore + riskScore + ecosystemScore + recoveryScore;
  const compositeScore = clamp((raw / 95) * 100, 0, 100);

  const hardZero =
    (cp?.marketCapRank != null && cp.marketCapRank > 800 && (change1y ?? 0) < -70) ||
    (change1y != null && change1y < -90);

  const grade = gradeFromComposite(compositeScore, hardZero);
  const rationaleKeys: string[] = [];

  if (cp?.marketCapRank != null && cp.marketCapRank <= 20) {
    rationaleKeys.push("rationaleCryptoTopRank");
  }
  if (change1y != null && change1y > 0) rationaleKeys.push("rationaleCryptoPositiveYear");
  if (ecosystemScore >= 10) rationaleKeys.push("rationaleCryptoStrongEcosystem");
  if (dataConfidence.tier === "high" || dataConfidence.tier === "institutional") {
    rationaleKeys.push("rationaleHighConfidence");
  }
  if (hardZero) rationaleKeys.push("rationaleCryptoDistress");

  return {
    grade,
    assetClass: "crypto",
    compositeScore: Math.round(compositeScore * 10) / 10,
    labelKey: GRADE_LABEL_KEYS[grade],
    summaryKey: GRADE_SUMMARY_KEYS[grade],
    pillars,
    rationaleKeys,
    dataConfidence,
  };
}
