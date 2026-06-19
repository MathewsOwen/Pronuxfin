import type { AssetDossier } from "@/lib/market/types";

function normalizeRatio(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) > 1.5) return value / 100;
  return value;
}

function ratiosAgree(a: number | null, b: number | null, tolerance = 0.35): boolean {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) return true;
  if (a === 0 && b === 0) return true;
  const denom = Math.max(Math.abs(a), Math.abs(b), 1e-6);
  return Math.abs(a - b) / denom <= tolerance;
}

/**
 * Cruza BRAPI/Yahoo com FMP para priorizar demonstrações e TTM quando disponíveis.
 */
export function enrichAssetDossier(dossier: AssetDossier): AssetDossier {
  if (dossier.assetClass === "crypto") return dossier;
  return reconcileEquityDossier(dossier);
}

function reconcileEquityDossier(dossier: AssetDossier): AssetDossier {
  const stmt = dossier.intlAnnualStatements;
  const ttm = dossier.intlKeyMetricsTtm;
  const extras = { ...dossier.marketExtras };

  let priceEarnings = dossier.priceEarnings;
  let earningsPerShare = dossier.earningsPerShare;
  let marketCap = dossier.marketCap;
  const verifiedFields: string[] = [];

  if (stmt?.revenue != null && stmt.revenue > 0 && stmt.netIncome != null) {
    extras.profitMargin = stmt.netIncome / stmt.revenue;
    verifiedFields.push("profitMargin");
  }

  if (stmt?.netIncome != null && stmt.netIncome < 0) {
    extras.profitMargin = stmt.netIncome / Math.max(stmt.revenue ?? 1, 1);
    verifiedFields.push("netIncome");
  }

  const ttmRoe = normalizeRatio(ttm?.roe);
  if (ttmRoe != null) {
    if (
      extras.returnOnEquity == null ||
      ratiosAgree(normalizeRatio(extras.returnOnEquity), ttmRoe, 0.45)
    ) {
      extras.returnOnEquity = ttmRoe;
      verifiedFields.push("roe");
    }
  }

  if (ttm?.debtToEquity != null && Number.isFinite(ttm.debtToEquity)) {
    extras.debtToEquity = ttm.debtToEquity;
    verifiedFields.push("debtToEquity");
  }

  if (ttm?.dividendYield != null) {
    extras.dividendYield = normalizeRatio(ttm.dividendYield);
    verifiedFields.push("dividendYield");
  }

  if (ttm?.peRatio != null && Number.isFinite(ttm.peRatio) && ttm.peRatio > 0) {
    if (priceEarnings == null || !ratiosAgree(priceEarnings, ttm.peRatio, 0.4)) {
      priceEarnings = ttm.peRatio;
      verifiedFields.push("peRatio");
    }
  }

  if (ttm?.netIncomePerShare != null && Number.isFinite(ttm.netIncomePerShare)) {
    earningsPerShare = ttm.netIncomePerShare;
    verifiedFields.push("eps");
  }

  if (ttm?.marketCap != null && Number.isFinite(ttm.marketCap) && ttm.marketCap > 0) {
    marketCap = ttm.marketCap;
    verifiedFields.push("marketCap");
  }

  if (stmt?.freeCashFlow != null && stmt.freeCashFlow > 0) {
    verifiedFields.push("freeCashFlow");
  }

  const sourceLabel =
    verifiedFields.length >= 3 && dossier.deskMarket !== "br"
      ? "Yahoo Finance + FMP · reconciliado"
      : verifiedFields.length >= 2 && dossier.deskMarket === "br"
        ? "BRAPI + FMP · reconciliado"
        : dossier.sourceLabel;

  return {
    ...dossier,
    marketExtras: {
      ...extras,
      sourceLabel:
        verifiedFields.length > 0
          ? `${extras.sourceLabel} · FMP cross-check`
          : extras.sourceLabel,
    },
    priceEarnings,
    earningsPerShare,
    marketCap,
    sourceLabel,
  };
}
