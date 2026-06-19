/** PRONUXFIN Core Analytica — tipos compartilhados (V2.0-ULTRA). */

export type RiskProfileId = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

export type RiskClassificationId =
  | "ELITE_COMPOUNDER"
  | "QUALITY_GROWTH"
  | "TURNAROUND"
  | "CYCLICAL"
  | "WATCHLIST"
  | "TOXIC_BOMB";

export type AssetQuantInput = {
  ticker: string;
  netDebtEbitda: number | null;
  netMargin: number | null;
  roe: number | null;
  consecutiveProfitableYears: number;
  revenueCagr5y: number | null;
};

export type AssetQualitativeInput = {
  ticker: string;
  sectorPerenniality: number;
  governanceScore: number;
  competitiveMoat: number;
  managementExecution: number;
};

export type QuantRiskResult = {
  ticker: string;
  healthScore: number;
  debtPenalty: number;
  isToxicBomb: boolean;
  riskClassification: RiskClassificationId;
  diagnostics: string[];
};

export type QualitativeResult = {
  ticker: string;
  qualitativeScore: number;
  pci: number;
  isToxicBomb: boolean;
  riskClassification: RiskClassificationId;
};

export type PortfolioPositionInput = {
  ticker: string;
  currentValueBrl: number;
};

export type ApportionmentLine = {
  ticker: string;
  targetPct: number;
  currentPct: number;
  deltaPct: number;
  allocationBrl: number;
  postTradePct: number;
  riskClassification: RiskClassificationId;
  pci: number;
};

export type ApportionmentReport = {
  freshCashBrl: number;
  portfolioValueBeforeBrl: number;
  portfolioValueAfterBrl: number;
  lines: ApportionmentLine[];
  executionNotes: string[];
};

export type AssetAnalysisBundle = {
  quant: AssetQuantInput;
  qual: AssetQualitativeInput;
  quantResult: QuantRiskResult;
  qualResult: QualitativeResult;
};

export type PeerPciRow = {
  ticker: string;
  pci: number;
  healthScore: number;
  riskClassification: RiskClassificationId;
  isSubject: boolean;
};
