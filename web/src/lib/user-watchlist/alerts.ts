export type WatchlistAlertRuleType =
  | "large_move"
  | "news_flow"
  | "range_extreme"
  | "priority_shift";

export type WatchlistAlertRule = {
  ruleType: WatchlistAlertRuleType;
  threshold: number;
  enabled: boolean;
  symbol?: string;
};

export const WATCHLIST_ALERT_RULE_ORDER: WatchlistAlertRuleType[] = [
  "large_move",
  "news_flow",
  "range_extreme",
  "priority_shift",
];

export const DEFAULT_WATCHLIST_ALERT_RULES: WatchlistAlertRule[] = [
  { ruleType: "large_move", threshold: 2.25, enabled: true, symbol: "*" },
  { ruleType: "news_flow", threshold: 2, enabled: true, symbol: "*" },
  { ruleType: "range_extreme", threshold: 78, enabled: true, symbol: "*" },
  { ruleType: "priority_shift", threshold: 10, enabled: true, symbol: "*" },
];

export function normalizeAlertRuleScope(symbol?: string | null) {
  const value = symbol?.trim().toUpperCase();
  return value && value.length > 0 ? value : "*";
}

export function resolveAlertRuleThreshold(
  rules: WatchlistAlertRule[],
  ruleType: WatchlistAlertRuleType,
  fallback: number,
  symbol?: string | null,
) {
  const scope = normalizeAlertRuleScope(symbol);
  const scoped = rules.find(
    (rule) =>
      rule.ruleType === ruleType &&
      rule.enabled &&
      normalizeAlertRuleScope(rule.symbol) === scope,
  );
  if (scoped?.threshold != null) return scoped.threshold;

  const global = rules.find(
    (rule) =>
      rule.ruleType === ruleType &&
      rule.enabled &&
      normalizeAlertRuleScope(rule.symbol) === "*",
  );
  return global?.threshold ?? fallback;
}
