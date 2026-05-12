import type { AssetDossier } from "@/lib/market/types";
import {
  DEFAULT_WATCHLIST_ALERT_RULES,
  resolveAlertRuleThreshold,
  type WatchlistAlertRule,
} from "@/lib/user-watchlist/alerts";
import type { WatchlistRadarSignal } from "@/lib/user-watchlist/intelligence";
import type { WatchlistSignalSnapshot } from "@/lib/user-watchlist/history";

export type WatchlistBriefingKind =
  | "attention_up"
  | "fresh_news"
  | "range_extreme"
  | "steady_high"
  | "baseline";

export type WatchlistBriefingItem = {
  symbol: string;
  companyName: string;
  priority: number;
  attentionLevel: WatchlistRadarSignal["attentionLevel"];
  kind: WatchlistBriefingKind;
  delta: number | null;
  newsCount: number;
};

export type WatchlistAlertCenterEvent = {
  symbol: string;
  companyName: string;
  priority: number;
  attentionLevel: WatchlistRadarSignal["attentionLevel"];
  kind: WatchlistBriefingKind;
  delta: number | null;
  newsCount: number;
  previousCreatedAt: string | null;
};

export function buildWatchlistBriefing(
  entries: Array<{
    dossier: AssetDossier;
    signal: WatchlistRadarSignal;
    previous?: WatchlistSignalSnapshot;
  }>,
  rules: WatchlistAlertRule[] = DEFAULT_WATCHLIST_ALERT_RULES,
): WatchlistBriefingItem[] {
  return entries
    .map(({ dossier, signal, previous }) => {
      const delta = previous ? signal.priority - previous.priority : null;
      const kind = classifyBriefingKind(dossier.symbol, signal, previous, rules);
      return {
        symbol: dossier.symbol,
        companyName: dossier.companyName,
        priority: signal.priority,
        attentionLevel: signal.attentionLevel,
        kind,
        delta,
        newsCount: signal.newsCount,
      } satisfies WatchlistBriefingItem;
    })
    .sort((a, b) => {
      const scoreA = briefingSortScore(a);
      const scoreB = briefingSortScore(b);
      return scoreB - scoreA;
    })
    .slice(0, 4);
}

export function buildWatchlistAlertCenter(
  entries: Array<{
    dossier: AssetDossier;
    signal: WatchlistRadarSignal;
    previous?: WatchlistSignalSnapshot;
  }>,
  rules: WatchlistAlertRule[] = DEFAULT_WATCHLIST_ALERT_RULES,
): WatchlistAlertCenterEvent[] {
  return entries
    .map(({ dossier, signal, previous }) => {
      const delta = previous ? signal.priority - previous.priority : null;
      const kind = classifyBriefingKind(dossier.symbol, signal, previous, rules);
      return {
        symbol: dossier.symbol,
        companyName: dossier.companyName,
        priority: signal.priority,
        attentionLevel: signal.attentionLevel,
        kind,
        delta,
        newsCount: signal.newsCount,
        previousCreatedAt: previous?.createdAt ?? null,
      } satisfies WatchlistAlertCenterEvent;
    })
    .sort((a, b) => briefingSortScore(b) - briefingSortScore(a))
    .slice(0, 6);
}

function classifyBriefingKind(
  symbol: string,
  signal: WatchlistRadarSignal,
  previous?: WatchlistSignalSnapshot,
  rules: WatchlistAlertRule[] = DEFAULT_WATCHLIST_ALERT_RULES,
): WatchlistBriefingKind {
  const delta = previous ? signal.priority - previous.priority : 0;
  const priorityShiftThreshold = resolveAlertRuleThreshold(
    rules,
    "priority_shift",
    10,
    symbol,
  );
  if (
    !previous ||
    delta >= priorityShiftThreshold ||
    previous.attentionLevel !== signal.attentionLevel
  ) {
    return "attention_up";
  }
  if (signal.newsCount > (previous?.newsCount ?? 0)) {
    return "fresh_news";
  }
  if (
    signal.reasons.some(
      (reason) =>
        reason.code === "near_52w_high" || reason.code === "near_52w_low",
    )
  ) {
    return "range_extreme";
  }
  if (signal.attentionLevel === "high") {
    return "steady_high";
  }
  return "baseline";
}

function briefingSortScore(item: WatchlistBriefingItem) {
  const kindWeight = {
    attention_up: 40,
    fresh_news: 34,
    range_extreme: 28,
    steady_high: 22,
    baseline: 12,
  }[item.kind];
  return kindWeight + item.priority + Math.max(item.delta ?? 0, 0);
}
