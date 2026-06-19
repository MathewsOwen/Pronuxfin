/**
 * PRONUXFIN Core Analytica Engine (V2.0-ULTRA) — TypeScript port.
 * Detox quant → Mentalist qual → PCI → Cash apportionment (buy-only).
 */

import type {
  ApportionmentLine,
  ApportionmentReport,
  AssetAnalysisBundle,
  AssetQualitativeInput,
  AssetQuantInput,
  PortfolioPositionInput,
  QualitativeResult,
  QuantRiskResult,
  RiskClassificationId,
  RiskProfileId,
} from "@/lib/analytica/types";

type RiskProfileConfig = {
  debtEbitdaThreshold: number;
  minNetMargin: number;
  minRoe: number;
  minProfitableYears: number;
  debtPenaltyMultiplier: number;
  marginWeight: number;
  roeWeight: number;
  growthWeight: number;
};

const PROFILE_CONFIGS: Record<RiskProfileId, RiskProfileConfig> = {
  CONSERVATIVE: {
    debtEbitdaThreshold: 2.0,
    minNetMargin: 0.08,
    minRoe: 0.12,
    minProfitableYears: 3,
    debtPenaltyMultiplier: 25,
    marginWeight: 0.22,
    roeWeight: 0.22,
    growthWeight: 0.16,
  },
  MODERATE: {
    debtEbitdaThreshold: 3.0,
    minNetMargin: 0.05,
    minRoe: 0.08,
    minProfitableYears: 2,
    debtPenaltyMultiplier: 20,
    marginWeight: 0.2,
    roeWeight: 0.2,
    growthWeight: 0.18,
  },
  AGGRESSIVE: {
    debtEbitdaThreshold: 4.5,
    minNetMargin: 0.02,
    minRoe: 0.05,
    minProfitableYears: 1,
    debtPenaltyMultiplier: 15,
    marginWeight: 0.18,
    roeWeight: 0.18,
    growthWeight: 0.22,
  },
};

const QUAL_WEIGHTS = [0.35, 0.25, 0.2, 0.2] as const;
const PCI_QUANT_WEIGHT = 0.6;
const PCI_QUAL_WEIGHT = 0.4;
const TOXIC_THRESHOLD = 50;

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function safeFloat(value: number | null | undefined, fallback = 0): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return value;
}

function pct(value: number, total: number): number {
  if (total <= 0) return 0;
  return value / total;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function classifyRisk(
  health: number,
  years: number,
  margin: number,
  cagr: number,
  isToxic: boolean,
): RiskClassificationId {
  if (isToxic) return "TOXIC_BOMB";
  if (health >= 82 && years >= 5 && margin >= 0.12) return "ELITE_COMPOUNDER";
  if (health >= 68 && cagr >= 0.1) return "QUALITY_GROWTH";
  if (years <= 2 && health >= 55) return "TURNAROUND";
  if (cagr < 0.03 && health >= 50) return "CYCLICAL";
  return "WATCHLIST";
}

export class QuantitativeRiskEngine {
  constructor(private readonly profile: RiskProfileId = "MODERATE") {}

  evaluate(data: AssetQuantInput): QuantRiskResult {
    const cfg = PROFILE_CONFIGS[this.profile];
    const diagnostics: string[] = [];

    const debt = safeFloat(data.netDebtEbitda, 99);
    const margin = safeFloat(data.netMargin);
    const roe = safeFloat(data.roe);
    const cagr = safeFloat(data.revenueCagr5y);
    const years = Math.max(0, data.consecutiveProfitableYears ?? 0);

    let debtPenalty = 0;
    if (debt > cfg.debtEbitdaThreshold) {
      debtPenalty = (debt - cfg.debtEbitdaThreshold) * cfg.debtPenaltyMultiplier;
      diagnostics.push(
        `Dívida líquida/EBITDA ${debt.toFixed(2)}x excede limite ${cfg.debtEbitdaThreshold.toFixed(2)}x (penalidade ${debtPenalty.toFixed(1)} pts).`,
      );
    }

    const marginScore = clamp((margin / Math.max(cfg.minNetMargin, 1e-6)) * 100, 0, 100);
    const roeScore = clamp((roe / Math.max(cfg.minRoe, 1e-6)) * 100, 0, 100);
    const growthScore = clamp(((cagr + 0.05) / 0.25) * 100, 0, 100);
    const longevityScore = clamp((years / Math.max(cfg.minProfitableYears, 1)) * 100, 0, 100);

    if (years === 0) {
      diagnostics.push("Armadilha de ferro: zero anos consecutivos de lucro operacional estimado.");
    }
    if (margin < cfg.minNetMargin) {
      diagnostics.push(`Margem líquida ${(margin * 100).toFixed(1)}% abaixo do piso ${(cfg.minNetMargin * 100).toFixed(0)}%.`);
    }
    if (roe < cfg.minRoe) {
      diagnostics.push(`ROE ${(roe * 100).toFixed(1)}% abaixo do piso ${(cfg.minRoe * 100).toFixed(0)}%.`);
    }

    const base =
      longevityScore * 0.28 +
      marginScore * cfg.marginWeight +
      roeScore * cfg.roeWeight +
      growthScore * cfg.growthWeight;

    const healthScore = clamp(base - debtPenalty, 0, 100);
    const isToxicBomb = healthScore < TOXIC_THRESHOLD || years === 0;

    return {
      ticker: data.ticker,
      healthScore: round2(healthScore),
      debtPenalty: round2(debtPenalty),
      isToxicBomb,
      riskClassification: classifyRisk(healthScore, years, margin, cagr, isToxicBomb),
      diagnostics,
    };
  }
}

export class QualitativeTrustEngine {
  synthesize(quant: QuantRiskResult, qual: AssetQualitativeInput): QualitativeResult {
    const p = clamp(safeFloat(qual.sectorPerenniality), 0, 10);
    const g = clamp(safeFloat(qual.governanceScore), 0, 10);
    const m = clamp(safeFloat(qual.competitiveMoat), 0, 10);
    const e = clamp(safeFloat(qual.managementExecution), 0, 10);

    const [wP, wG, wM, wE] = QUAL_WEIGHTS;
    const qualitativeScore = p * wP + g * wG + m * wM + e * wE;

    let pci = quant.healthScore * PCI_QUANT_WEIGHT + qualitativeScore * 10 * PCI_QUAL_WEIGHT;
    if (quant.isToxicBomb) pci = 0;

    return {
      ticker: qual.ticker,
      qualitativeScore: round2(qualitativeScore),
      pci: round2(clamp(pci, 0, 100)),
      isToxicBomb: quant.isToxicBomb,
      riskClassification: quant.riskClassification,
    };
  }
}

export class CashRebalancingEngine {
  apportion(
    pciByTicker: Record<string, number>,
    classifications: Record<string, RiskClassificationId>,
    positions: PortfolioPositionInput[],
    freshCashBrl: number,
  ): ApportionmentReport {
    const cash = Math.max(0, safeFloat(freshCashBrl));
    const eligiblePci: Record<string, number> = {};
    for (const [ticker, pci] of Object.entries(pciByTicker)) {
      if (classifications[ticker] !== "TOXIC_BOMB") {
        eligiblePci[ticker] = Math.max(0, pci);
      }
    }

    const pciSum = Object.values(eligiblePci).reduce((a, b) => a + b, 0);
    const positionMap: Record<string, number> = {};
    for (const p of positions) {
      positionMap[p.ticker] = Math.max(0, p.currentValueBrl);
    }
    for (const ticker of Object.keys(eligiblePci)) {
      if (positionMap[ticker] == null) positionMap[ticker] = 0;
    }

    const portfolioBefore = Object.values(positionMap).reduce((a, b) => a + b, 0);
    const notes: string[] = [];

    if (pciSum <= 0) {
      notes.push("Nenhum ativo elegível com PCI > 0 — caixa mantido em liquidez.");
      return {
        freshCashBrl: cash,
        portfolioValueBeforeBrl: portfolioBefore,
        portfolioValueAfterBrl: portfolioBefore + cash,
        lines: [],
        executionNotes: notes,
      };
    }

    const targetPct: Record<string, number> = {};
    for (const [ticker, pci] of Object.entries(eligiblePci)) {
      targetPct[ticker] = pci / pciSum;
    }

    const currentPct: Record<string, number> = {};
    for (const ticker of Object.keys(targetPct)) {
      currentPct[ticker] = pct(positionMap[ticker] ?? 0, portfolioBefore);
    }

    const deltaPct: Record<string, number> = {};
    for (const ticker of Object.keys(targetPct)) {
      deltaPct[ticker] = targetPct[ticker] - currentPct[ticker];
    }

    const underweight: Record<string, number> = {};
    for (const [ticker, d] of Object.entries(deltaPct)) {
      if (d > 1e-9) underweight[ticker] = d;
    }

    if (Object.keys(underweight).length === 0) {
      notes.push("Carteira já em equilíbrio ou acima do alvo PCI — sem compras sugeridas.");
      const lines: ApportionmentLine[] = Object.keys(targetPct)
        .sort()
        .map((ticker) => ({
          ticker,
          targetPct: round2(targetPct[ticker] * 100),
          currentPct: round2(currentPct[ticker] * 100),
          deltaPct: round2(deltaPct[ticker] * 100),
          allocationBrl: 0,
          postTradePct: round2(currentPct[ticker] * 100),
          riskClassification: classifications[ticker] ?? "WATCHLIST",
          pci: round2(eligiblePci[ticker]),
        }));
      return {
        freshCashBrl: cash,
        portfolioValueBeforeBrl: portfolioBefore,
        portfolioValueAfterBrl: portfolioBefore + cash,
        lines,
        executionNotes: notes,
      };
    }

    const totalDelta = Object.values(underweight).reduce((a, b) => a + b, 0);
    const rawAlloc: Record<string, number> = {};
    for (const [ticker, d] of Object.entries(underweight)) {
      rawAlloc[ticker] = cash * (d / totalDelta);
    }

    const portfolioAfter = portfolioBefore + cash;
    const lines: ApportionmentLine[] = Object.keys(targetPct)
      .sort()
      .map((ticker) => {
        const alloc = rawAlloc[ticker] ?? 0;
        const newValue = (positionMap[ticker] ?? 0) + alloc;
        return {
          ticker,
          targetPct: round2(targetPct[ticker] * 100),
          currentPct: round2(currentPct[ticker] * 100),
          deltaPct: round2(deltaPct[ticker] * 100),
          allocationBrl: round2(alloc),
          postTradePct: round2(pct(newValue, portfolioAfter) * 100),
          riskClassification: classifications[ticker] ?? "WATCHLIST",
          pci: round2(eligiblePci[ticker]),
        };
      });

    notes.push("Regra crítica: nenhuma operação de venda sugerida.");
    notes.push(
      `Caixa distribuído entre ${Object.keys(underweight).length} ativo(s) subalocados (peso proporcional ao Δ até o alvo PCI).`,
    );

    return {
      freshCashBrl: cash,
      portfolioValueBeforeBrl: portfolioBefore,
      portfolioValueAfterBrl: portfolioAfter,
      lines,
      executionNotes: notes,
    };
  }
}

export class PronuxfinAnalyticaEngine {
  private readonly riskEngine: QuantitativeRiskEngine;
  private readonly trustEngine = new QualitativeTrustEngine();
  private readonly cashEngine = new CashRebalancingEngine();

  constructor(private readonly profile: RiskProfileId = "MODERATE") {
    this.riskEngine = new QuantitativeRiskEngine(profile);
  }

  get riskProfile(): RiskProfileId {
    return this.profile;
  }

  analyzeAsset(quant: AssetQuantInput, qual: AssetQualitativeInput): AssetAnalysisBundle {
    if (quant.ticker !== qual.ticker) {
      throw new Error(`Ticker mismatch: ${quant.ticker} vs ${qual.ticker}`);
    }
    const quantResult = this.riskEngine.evaluate(quant);
    const qualResult = this.trustEngine.synthesize(quantResult, qual);
    return { quant, qual, quantResult, qualResult };
  }

  recommendCashDeployment(
    bundles: AssetAnalysisBundle[],
    positions: PortfolioPositionInput[],
    freshCashBrl: number,
  ): ApportionmentReport {
    const pci: Record<string, number> = {};
    const classes: Record<string, RiskClassificationId> = {};
    for (const b of bundles) {
      pci[b.qualResult.ticker] = b.qualResult.pci;
      classes[b.qualResult.ticker] = b.qualResult.riskClassification;
    }
    return this.cashEngine.apportion(pci, classes, positions, freshCashBrl);
  }
}

/** Re-run analysis with a different risk profile (client-side). */
export function analyzeWithProfile(
  quant: AssetQuantInput,
  qual: AssetQualitativeInput,
  profile: RiskProfileId,
): AssetAnalysisBundle {
  return new PronuxfinAnalyticaEngine(profile).analyzeAsset(quant, qual);
}
