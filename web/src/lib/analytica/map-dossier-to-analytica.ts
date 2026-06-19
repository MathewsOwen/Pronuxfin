import type { AssetQualitativeInput, AssetQuantInput } from "@/lib/analytica/types";
import type { AssetAnalysisBundle, RiskProfileId } from "@/lib/analytica/types";
import { PronuxfinAnalyticaEngine } from "@/lib/analytica/pronuxfin-analytica-engine";
import type { AssetDossier } from "@/lib/market/types";

/** Normaliza ratio que pode vir como 0.18 ou 18. */
function normalizeRatio(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) > 1.5) return value / 100;
  return value;
}

function consecutiveProfitableYears(dossier: AssetDossier): number {
  const years = [...dossier.historicalInsights.calendarYearReturns].sort(
    (a, b) => b.year - a.year,
  );
  let streak = 0;
  for (const row of years) {
    if (row.returnPct > 0) streak += 1;
    else break;
  }

  const ni = dossier.intlAnnualStatements?.netIncome;
  if (ni != null && ni <= 0) return 0;

  if (streak > 0) return streak;

  const margin = normalizeRatio(dossier.marketExtras.profitMargin);
  if (margin != null && margin > 0) return 1;
  return 0;
}

function estimateRevenueCagr5y(dossier: AssetDossier): number | null {
  const fiveY = dossier.periodStats.fiveYears;
  if (fiveY != null && Number.isFinite(fiveY)) {
    const total = fiveY / 100;
    if (total <= -0.99) return -0.5;
    return Math.pow(1 + total, 1 / 5) - 1;
  }
  const threeY = dossier.periodStats.threeYears;
  if (threeY != null && Number.isFinite(threeY)) {
    return (threeY / 100) / 3;
  }
  return null;
}

function estimateNetDebtEbitda(dossier: AssetDossier): number | null {
  const stmt = dossier.intlAnnualStatements;
  if (stmt?.totalDebt != null && stmt.operatingIncome != null && stmt.operatingIncome > 0) {
    return stmt.totalDebt / stmt.operatingIncome;
  }

  const dte = dossier.marketExtras.debtToEquity ?? dossier.intlKeyMetricsTtm?.debtToEquity;
  if (dte != null && Number.isFinite(dte)) {
    return Math.max(0, dte * 0.75 + 0.35);
  }

  return null;
}

const SECTOR_PERENNIALITY: Record<string, number> = {
  utilities: 8.5,
  consumer: 7.5,
  healthcare: 8.0,
  financials: 7.0,
  technology: 7.8,
  commodities: 6.0,
  oil_gas: 5.5,
  industrials: 6.8,
  defense_aerospace: 7.2,
};

function sectorPerennialityScore(dossier: AssetDossier): number {
  const sector = (dossier.sector ?? dossier.industry ?? "").toLowerCase();
  for (const [key, score] of Object.entries(SECTOR_PERENNIALITY)) {
    if (sector.includes(key.replace("_", " ")) || sector.includes(key)) return score;
  }
  if (/utilidad|energia|saúde|health|finance|banco|tech|software/.test(sector)) return 7.5;
  if (/miner|sider|petro|oil|commod/.test(sector)) return 5.8;
  return 6.5;
}

function governanceScore(dossier: AssetDossier): number {
  let score = 6.5;
  if (dossier.marketCap != null && dossier.marketCap > 20_000_000_000) score += 1.2;
  else if (dossier.marketCap != null && dossier.marketCap > 5_000_000_000) score += 0.6;
  if (dossier.website) score += 0.3;
  if (dossier.ceoName) score += 0.2;
  if (dossier.fullTimeEmployees != null && dossier.fullTimeEmployees > 5000) score += 0.4;
  return Math.min(10, score);
}

function moatScore(dossier: AssetDossier): number {
  const margin = normalizeRatio(dossier.marketExtras.profitMargin);
  const roe = normalizeRatio(
    dossier.marketExtras.returnOnEquity ?? dossier.intlKeyMetricsTtm?.roe,
  );
  let score = 5.5;
  if (margin != null) score += clamp01(margin / 0.2) * 2.5;
  if (roe != null) score += clamp01(roe / 0.25) * 2;
  if ((dossier.marketExtras.dividendYield ?? 0) > 0.04) score += 0.5;
  return Math.min(10, score);
}

function executionScore(dossier: AssetDossier): number {
  const cagr = estimateRevenueCagr5y(dossier);
  const years = consecutiveProfitableYears(dossier);
  let score = 5.0;
  score += Math.min(2.5, years * 0.5);
  if (cagr != null) score += clamp01((cagr + 0.05) / 0.2) * 2.5;
  if (dossier.periodStats.oneYear != null && dossier.periodStats.oneYear > 15) score += 0.5;
  return Math.min(10, score);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function mapDossierToQuantInput(dossier: AssetDossier): AssetQuantInput {
  const margin =
    normalizeRatio(dossier.marketExtras.profitMargin) ??
    (dossier.intlAnnualStatements?.netIncome != null &&
    dossier.intlAnnualStatements.revenue != null &&
    dossier.intlAnnualStatements.revenue > 0
      ? dossier.intlAnnualStatements.netIncome / dossier.intlAnnualStatements.revenue
      : null);

  const roe =
    normalizeRatio(dossier.marketExtras.returnOnEquity) ??
    normalizeRatio(dossier.intlKeyMetricsTtm?.roe);

  return {
    ticker: dossier.symbol,
    netDebtEbitda: estimateNetDebtEbitda(dossier),
    netMargin: margin,
    roe,
    consecutiveProfitableYears: consecutiveProfitableYears(dossier),
    revenueCagr5y: estimateRevenueCagr5y(dossier),
  };
}

export function mapDossierToQualInput(dossier: AssetDossier): AssetQualitativeInput {
  return {
    ticker: dossier.symbol,
    sectorPerenniality: sectorPerennialityScore(dossier),
    governanceScore: governanceScore(dossier),
    competitiveMoat: moatScore(dossier),
    managementExecution: executionScore(dossier),
  };
}

export function analyzeDossier(
  dossier: AssetDossier,
  profile: RiskProfileId = "MODERATE",
): AssetAnalysisBundle {
  const engine = new PronuxfinAnalyticaEngine(profile);
  return engine.analyzeAsset(mapDossierToQuantInput(dossier), mapDossierToQualInput(dossier));
}

export type DossierAnalyticaPayload = {
  subject: AssetAnalysisBundle;
  peers: AssetAnalysisBundle[];
  inputs: {
    quant: AssetQuantInput;
    qual: AssetQualitativeInput;
  };
};

export async function buildDossierAnalyticaPayload(
  dossier: AssetDossier,
  profile: RiskProfileId,
  loadPeer: (symbol: string) => Promise<AssetDossier | null>,
  maxPeers = 4,
): Promise<DossierAnalyticaPayload> {
  const subject = analyzeDossier(dossier, profile);
  const peerSymbols = dossier.comparablePeers
    .filter((s) => s !== dossier.symbol)
    .slice(0, maxPeers);

  const peerBundles: AssetAnalysisBundle[] = [];
  for (const sym of peerSymbols) {
    const peerDossier = await loadPeer(sym);
    if (peerDossier) {
      peerBundles.push(analyzeDossier(peerDossier, profile));
    }
  }

  return {
    subject,
    peers: peerBundles,
    inputs: {
      quant: mapDossierToQuantInput(dossier),
      qual: mapDossierToQualInput(dossier),
    },
  };
}
