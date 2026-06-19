/** Selo PRONUX — nota de saúde do ativo de 0 (crítico) a 5 (excelente). */

export type SeloGrade = 0 | 1 | 2 | 3 | 4 | 5;

export type SeloAssetClass = "equity" | "crypto";

export type SeloPillar = {
  id: string;
  labelKey: string;
  score: number;
  maxScore: number;
  detailKey?: string;
};

export type DossierDataConfidenceTier = "low" | "medium" | "high" | "institutional";

export type DossierDataConfidence = {
  score: number;
  tier: DossierDataConfidenceTier;
  sources: string[];
  verifiedFields: string[];
};

export type DossierSeloResult = {
  grade: SeloGrade;
  assetClass: SeloAssetClass;
  compositeScore: number;
  labelKey: string;
  summaryKey: string;
  pillars: SeloPillar[];
  rationaleKeys: string[];
  dataConfidence: DossierDataConfidence;
};
