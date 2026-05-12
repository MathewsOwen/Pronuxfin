import type { AssetDossier } from "@/lib/market/types";

import {
  DEFAULT_WATCHLIST_ALERT_RULES,
  resolveAlertRuleThreshold,
  type WatchlistAlertRule,
  type WatchlistAlertRuleType,
} from "@/lib/user-watchlist/alerts";

export type WatchlistAttentionLevel = "high" | "medium" | "baseline";

export type WatchlistRadarReasonCode =
  | "large_move"
  | "news_flow"
  | "near_52w_high"
  | "near_52w_low"
  | "live_history"
  | "liquid";

export type WatchlistRadarReason = {
  code: WatchlistRadarReasonCode;
  value?: number;
};

export type WatchlistRadarSignal = {
  priority: number;
  attentionLevel: WatchlistAttentionLevel;
  moveAbs: number;
  newsCount: number;
  rangeProgress: number | null;
  reasons: WatchlistRadarReason[];
};

export function buildWatchlistRadarSignal(
  dossier: AssetDossier,
  rules: WatchlistAlertRule[] = DEFAULT_WATCHLIST_ALERT_RULES,
): WatchlistRadarSignal {
  const largeMoveThreshold = alertThreshold(rules, dossier.symbol, "large_move", 2.25);
  const newsFlowThreshold = alertThreshold(rules, dossier.symbol, "news_flow", 2);
  const rangeExtremeThreshold = alertThreshold(rules, dossier.symbol, "range_extreme", 78);
  const moveAbs = Math.abs(dossier.quote.regularMarketChangePercent ?? 0);
  const newsCount = dossier.relatedNews.length;
  const rangeProgress = computeRangeProgress(
    dossier.fiftyTwoWeekLow,
    dossier.fiftyTwoWeekHigh,
    dossier.quote.regularMarketPrice,
  );
  const nearHigh = rangeProgress != null && rangeProgress >= rangeExtremeThreshold;
  const nearLow =
    rangeProgress != null && rangeProgress <= Math.max(100 - rangeExtremeThreshold, 0);
  const hasLiveHistory = dossier.historyMode === "live";
  const hasVolume =
    typeof dossier.regularMarketVolume === "number" &&
    Number.isFinite(dossier.regularMarketVolume) &&
    dossier.regularMarketVolume > 0;

  const score =
    18 +
    Math.min(28, moveAbs * 5) +
    Math.min(18, newsCount * 5) +
    (nearHigh || nearLow ? 12 : 0) +
    (hasLiveHistory ? 10 : 0) +
    (hasVolume ? 8 : 0);

  const priority = Math.round(Math.min(99, score));
  const attentionLevel =
    priority >= 68 ? "high" : priority >= 44 ? "medium" : "baseline";

  const reasons: WatchlistRadarReason[] = [];
  if (moveAbs >= largeMoveThreshold) reasons.push({ code: "large_move", value: moveAbs });
  if (newsCount >= newsFlowThreshold) reasons.push({ code: "news_flow", value: newsCount });
  if (nearHigh) reasons.push({ code: "near_52w_high", value: rangeProgress ?? undefined });
  if (nearLow) reasons.push({ code: "near_52w_low", value: rangeProgress ?? undefined });
  if (hasLiveHistory) reasons.push({ code: "live_history" });
  if (hasVolume) reasons.push({ code: "liquid" });

  if (reasons.length === 0) {
    reasons.push({ code: hasLiveHistory ? "live_history" : "liquid" });
  }

  return {
    priority,
    attentionLevel,
    moveAbs,
    newsCount,
    rangeProgress,
    reasons: reasons.slice(0, 3),
  };
}

function computeRangeProgress(
  low: number | null,
  high: number | null,
  current: number | null,
) {
  if (low == null || high == null || current == null || high <= low) return null;
  const raw = ((current - low) / (high - low)) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function alertThreshold(
  rules: WatchlistAlertRule[],
  symbol: string,
  ruleType: WatchlistAlertRuleType,
  fallback: number,
) {
  return resolveAlertRuleThreshold(rules, ruleType, fallback, symbol);
}
