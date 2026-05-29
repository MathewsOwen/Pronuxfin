"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  BrainCircuit,
  Flame,
  RotateCcw,
  Settings2,
  Siren,
  Waves,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/market/time";
import { apiMutation } from "@/lib/http/api-mutation-fetch";
import {
  normalizeAlertRuleScope,
  resolveAlertRuleThreshold,
  WATCHLIST_ALERT_RULE_ORDER,
  type WatchlistAlertRule,
  type WatchlistAlertRuleType,
} from "@/lib/user-watchlist/alerts";
import type { WatchlistAlertCenterEvent } from "@/lib/user-watchlist/briefing";
import type { WatchlistSignalSnapshot } from "@/lib/user-watchlist/history";
import type { UserWatchlistItemView } from "@/lib/user-watchlist/load";

type EditableRule = WatchlistAlertRule & { localId: string };
type DisplayRule = EditableRule & { inherited: boolean };

const RULE_META: Record<
  WatchlistAlertRuleType,
  { icon: typeof Flame; tone: string }
> = {
  large_move: {
    icon: Flame,
    tone: "border-primary/20 bg-status-warning/8 text-status-warning",
  },
  news_flow: {
    icon: BellRing,
    tone: "border-cognitive/25 bg-cognitive/10 text-cognitive",
  },
  range_extreme: {
    icon: Waves,
    tone: "border-status-live/25 bg-status-live/10 text-status-live",
  },
  priority_shift: {
    icon: Siren,
    tone: "border-status-degraded/25 bg-status-degraded/10 text-status-degraded",
  },
};

export function WatchlistAlertCenterPage({
  watchlistItems,
  initialRules,
  recentSignals,
  activeEvents,
  locale,
}: {
  watchlistItems: UserWatchlistItemView[];
  initialRules: WatchlistAlertRule[];
  recentSignals: WatchlistSignalSnapshot[];
  activeEvents: WatchlistAlertCenterEvent[];
  locale: string;
}) {
  const t = useTranslations("AlertsCenter");
  const router = useRouter();
  const [rules, setRules] = useState<EditableRule[]>(
    initialRules.map((rule) => ({
      ...rule,
      symbol: normalizeAlertRuleScope(rule.symbol),
      localId: `${rule.ruleType}:${normalizeAlertRuleScope(rule.symbol)}`,
    })),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(
    watchlistItems[0]?.symbol ?? null,
  );

  const highAttentionCount = activeEvents.filter(
    (item) => item.attentionLevel === "high",
  ).length;
  const eventCount = activeEvents.length;
  const recentCount = recentSignals.length;

  const visibleRules = useMemo(
    () => buildScopeRules(rules, "*"),
    [rules],
  );
  const scopedRules = useMemo(
    () => (selectedSymbol ? buildScopeRules(rules, selectedSymbol) : []),
    [rules, selectedSymbol],
  );
  const scopedOverrideCount = useMemo(
    () =>
      selectedSymbol
        ? rules.filter((rule) => normalizeAlertRuleScope(rule.symbol) === selectedSymbol).length
        : 0,
    [rules, selectedSymbol],
  );
  const assistantHref = useMemo(
    () => buildAlertsAssistantHref(activeEvents, recentSignals, selectedSymbol, locale),
    [activeEvents, recentSignals, selectedSymbol, locale],
  );

  function updateRule(
    scopeSymbol: string,
    ruleType: WatchlistAlertRuleType,
    patch: Partial<Pick<WatchlistAlertRule, "threshold" | "enabled">>,
  ) {
    const scope = normalizeAlertRuleScope(scopeSymbol);
    setRules((current) => {
      const existingIndex = current.findIndex(
        (rule) =>
          rule.ruleType === ruleType && normalizeAlertRuleScope(rule.symbol) === scope,
      );

      if (existingIndex >= 0) {
        return current.map((rule, index) =>
          index === existingIndex ? { ...rule, ...patch } : rule,
        );
      }

      const baseThreshold = resolveAlertRuleThreshold(current, ruleType, 1, scope);
      const baseEnabled = resolveRuleEnabled(current, ruleType, scope);
      return [
        ...current,
        {
          localId: `${ruleType}:${scope}`,
          ruleType,
          symbol: scope,
          threshold: patch.threshold ?? baseThreshold,
          enabled: patch.enabled ?? baseEnabled,
        },
      ];
    });
  }

  function saveRules(scopeSymbol: string) {
    setFeedback(null);
    startTransition(() => {
      void persistRules(scopeSymbol);
    });
  }

  async function persistRules(scopeSymbol: string) {
    const scope = normalizeAlertRuleScope(scopeSymbol);
    const scopeRules =
      scope === "*"
        ? buildScopeRules(rules, scope)
        : rules.filter((rule) => normalizeAlertRuleScope(rule.symbol) === scope);
    try {
      const res = await apiMutation("/api/user/watchlist/alert-rules", {
        method: "PATCH",
        body: JSON.stringify({
          rules: scopeRules.map((rule) => ({
            ruleType: rule.ruleType,
            threshold: rule.threshold,
            enabled: rule.enabled,
            symbol: scope === "*" ? undefined : scope,
          })),
        }),
      });

      if (!res.ok) throw new Error("alert_rules_patch_failed");
      const json = (await res.json()) as {
        ok: boolean;
        rules?: WatchlistAlertRule[];
      };

      if (!json.ok || !json.rules) throw new Error("alert_rules_patch_invalid");
      setRules(
        json.rules.map((rule) => ({
          ...rule,
          symbol: normalizeAlertRuleScope(rule.symbol),
          localId: `${rule.ruleType}:${normalizeAlertRuleScope(rule.symbol)}`,
        })),
      );
      setFeedback(scope === "*" ? t("saveSuccessDesk") : t("saveSuccessAsset"));
      router.refresh();
    } catch {
      setFeedback(t("saveError"));
    }
  }

  function resetScopedRule(ruleType: WatchlistAlertRuleType) {
    if (!selectedSymbol) return;
    const scope = selectedSymbol;
    setFeedback(null);
    startTransition(() => {
      void deleteScopedRule(scope, ruleType);
    });
  }

  async function deleteScopedRule(scopeSymbol: string, ruleType: WatchlistAlertRuleType) {
    try {
      const res = await apiMutation("/api/user/watchlist/alert-rules", {
        method: "DELETE",
        body: JSON.stringify({
          ruleType,
          symbol: scopeSymbol,
        }),
      });
      if (!res.ok) throw new Error("alert_rule_delete_failed");
      const json = (await res.json()) as {
        ok: boolean;
        rules?: WatchlistAlertRule[];
      };
      if (!json.ok || !json.rules) throw new Error("alert_rule_delete_invalid");
      setRules(
        json.rules.map((rule) => ({
          ...rule,
          symbol: normalizeAlertRuleScope(rule.symbol),
          localId: `${rule.ruleType}:${normalizeAlertRuleScope(rule.symbol)}`,
        })),
      );
      setFeedback(t("resetSuccess"));
      router.refresh();
    } catch {
      setFeedback(t("resetError"));
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] md:px-8">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {t("heroPillAlerts")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillRules")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillHistory")}
          </Badge>
        </div>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t("pageLead")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatChip label={t("summaryActive")} value={String(eventCount)} />
            <StatChip label={t("summaryHigh")} value={String(highAttentionCount)} />
            <StatChip label={t("summaryHistory")} value={String(recentCount)} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={assistantHref} className={buttonVariants({ size: "lg" })}>
            <BrainCircuit className="size-4" />
            {t("assistantCta")}
          </Link>
          <Link href="/assistant" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {t("assistantSecondary")}
          </Link>
        </div>
      </header>

      {watchlistItems.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title={t("watchlistEmptyTitle")}
          description={t("watchlistEmptyLead")}
        >
          <Link href="/bolsa" className={buttonVariants({ size: "lg" })}>
            {t("watchlistEmptyCta")}
          </Link>
        </EmptyState>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="font-heading">{t("rulesTitle")}</CardTitle>
              <CardDescription>{t("rulesSubtitle")}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("backDashboard")}
              </Link>
              <Button
                type="button"
                size="sm"
                onClick={() => saveRules("*")}
                disabled={isPending}
              >
                <Settings2 className="size-4" />
                {isPending ? t("savePending") : t("saveDeskCta")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {visibleRules.map((rule) => {
              const meta = RULE_META[rule.ruleType];
              const Icon = meta.icon;
              return (
                <div
                  key={rule.localId}
                  className={`rounded-3xl border p-4 ${meta.tone}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                        {t(`rules.${rule.ruleType}.title`)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t(`rules.${rule.ruleType}.description`)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {t("thresholdLabel")}
                      </span>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={String(rule.threshold)}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          updateRule("*", rule.ruleType, {
                            threshold: Number.isFinite(next) ? next : rule.threshold,
                          });
                        }}
                        className="mt-2"
                      />
                    </label>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t("enabledLabel")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rule.enabled ? t("enabledHintOn") : t("enabledHintOff")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={rule.enabled ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => updateRule("*", rule.ruleType, { enabled: !rule.enabled })}
                      >
                        {rule.enabled ? t("enabledOn") : t("enabledOff")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
          <CardContent className="pt-0">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    {t("assetRulesTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t("assetRulesSubtitle")}
                  </p>
                </div>
                {selectedSymbol ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => saveRules(selectedSymbol)}
                    disabled={isPending}
                  >
                    <Settings2 className="size-4" />
                    {isPending ? t("savePending") : t("saveAssetCta")}
                  </Button>
                ) : null}
              </div>

              {watchlistItems.length > 0 ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {watchlistItems.map((item) => {
                      const active = selectedSymbol === item.symbol;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedSymbol(item.symbol)}
                          className={
                            active
                              ? "rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                              : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                          }
                        >
                          {item.symbol}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSymbol ? (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {t("selectedAssetLabel", { symbol: selectedSymbol })}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {scopedOverrideCount > 0
                            ? t("selectedAssetOverrides", { value: scopedOverrideCount })
                            : t("selectedAssetInherited")}
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {scopedRules.map((rule) => {
                          const meta = RULE_META[rule.ruleType];
                          const Icon = meta.icon;
                          return (
                            <div
                              key={rule.localId}
                              className={`rounded-3xl border p-4 ${meta.tone}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                                    {t(`rules.${rule.ruleType}.title`)}
                                  </p>
                                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    {t(`rules.${rule.ruleType}.description`)}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                                  <Icon className="size-4" />
                                </div>
                              </div>
                              <div className="mt-3">
                                <Badge className="border-white/10 bg-black/20 text-muted-foreground">
                                  {rule.inherited ? t("ruleInherited") : t("ruleOverride")}
                                </Badge>
                              </div>
                              <div className="mt-4 space-y-3">
                                <label className="block">
                                  <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                    {t("thresholdLabel")}
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={String(rule.threshold)}
                                    onChange={(event) => {
                                      const next = Number(event.target.value);
                                      updateRule(selectedSymbol, rule.ruleType, {
                                        threshold:
                                          Number.isFinite(next) ? next : rule.threshold,
                                      });
                                    }}
                                    className="mt-2"
                                  />
                                </label>
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {t("enabledLabel")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {rule.enabled ? t("enabledHintOn") : t("enabledHintOff")}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant={rule.enabled ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                      updateRule(selectedSymbol, rule.ruleType, {
                                        enabled: !rule.enabled,
                                      })
                                    }
                                  >
                                    {rule.enabled ? t("enabledOn") : t("enabledOff")}
                                  </Button>
                                </div>
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={rule.inherited || isPending}
                                    onClick={() => resetScopedRule(rule.ruleType)}
                                  >
                                    <RotateCcw className="size-4" />
                                    {t("ruleReset")}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{t("assetRulesEmpty")}</p>
              )}
            </div>
          </CardContent>
          {feedback ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground">{feedback}</div>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
            <CardHeader>
              <CardTitle className="font-heading">{t("activeTitle")}</CardTitle>
              <CardDescription>{t("activeSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeEvents.length > 0 ? (
                activeEvents.map((event) => (
                  <div
                    key={`${event.symbol}-${event.kind}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-foreground">
                          {event.symbol}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {t(`eventKind.${event.kind}`, {
                            symbol: event.symbol,
                            value: event.delta ?? event.newsCount,
                          })}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {t("eventPriority", { value: event.priority })}
                        </p>
                      </div>
                      <Badge className={attentionBadgeClass(event.attentionLevel)}>
                        {t(attentionKey(event.attentionLevel))}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  compact
                  icon={BellRing}
                  title={t("activeEmptyTitle")}
                  description={t("activeEmpty")}
                />
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
            <CardHeader>
              <CardTitle className="font-heading">{t("historyTitle")}</CardTitle>
              <CardDescription>{t("historySubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSignals.length > 0 ? (
                recentSignals.map((signal, index) => (
                  <div
                    key={`${signal.symbol}-${signal.createdAt}-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-foreground">
                          {signal.symbol}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {t("historyPriority", { value: signal.priority })} ·{" "}
                          {signal.reasons
                            .map((reason) =>
                              t(`reason.${reason.code}`, {
                                value:
                                  reason.value != null
                                    ? Number(reason.value).toFixed(1)
                                    : "",
                              }),
                            )
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={attentionBadgeClass(signal.attentionLevel)}>
                          {t(attentionKey(signal.attentionLevel))}
                        </Badge>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {formatRelativeTime(signal.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  compact
                  icon={Waves}
                  title={t("historyEmptyTitle")}
                  description={t("historyEmpty")}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel rounded-2xl border border-white/10 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function attentionKey(level: "high" | "medium" | "baseline") {
  switch (level) {
    case "high":
      return "attentionHigh";
    case "medium":
      return "attentionMedium";
    default:
      return "attentionBaseline";
  }
}

function attentionBadgeClass(level: "high" | "medium" | "baseline") {
  switch (level) {
    case "high":
      return "border-primary/20 bg-primary/8 text-status-warning";
    case "medium":
      return "border-cognitive/25 bg-cognitive/10 text-cognitive";
    default:
      return "border-white/10 bg-white/[0.04] text-muted-foreground";
  }
}

function buildScopeRules(allRules: EditableRule[], scopeSymbol: string): DisplayRule[] {
  const scope = normalizeAlertRuleScope(scopeSymbol);
  return WATCHLIST_ALERT_RULE_ORDER.map((ruleType) => {
    const exact = allRules.find(
      (rule) =>
        rule.ruleType === ruleType && normalizeAlertRuleScope(rule.symbol) === scope,
    );
    if (exact) {
      return { ...exact, inherited: false };
    }

    const threshold = resolveAlertRuleThreshold(allRules, ruleType, 1, scope);
    const enabled = resolveRuleEnabled(allRules, ruleType, scope);
    return {
      localId: `${ruleType}:${scope}:derived`,
      ruleType,
      threshold,
      enabled,
      symbol: scope,
      inherited: scope !== "*",
    };
  });
}

function resolveRuleEnabled(
  rules: WatchlistAlertRule[],
  ruleType: WatchlistAlertRuleType,
  symbol?: string | null,
) {
  const scope = normalizeAlertRuleScope(symbol);
  const scoped = rules.find(
    (rule) =>
      rule.ruleType === ruleType &&
      normalizeAlertRuleScope(rule.symbol) === scope,
  );
  if (scoped) return scoped.enabled;

  const global = rules.find(
    (rule) =>
      rule.ruleType === ruleType &&
      normalizeAlertRuleScope(rule.symbol) === "*",
  );
  return global?.enabled ?? true;
}

function buildAlertsAssistantHref(
  activeEvents: WatchlistAlertCenterEvent[],
  recentSignals: WatchlistSignalSnapshot[],
  selectedSymbol: string | null,
  locale: string,
) {
  const focusSymbols = [
    ...(selectedSymbol ? [selectedSymbol] : []),
    ...activeEvents.map((event) => event.symbol),
    ...recentSignals.map((signal) => signal.symbol),
  ];
  const cleanSymbols = [...new Set(focusSymbols.filter(Boolean))].slice(0, 6);
  const label = cleanSymbols.join(", ");
  const activeSummary = activeEvents
    .slice(0, 3)
    .map((event) => `${event.symbol}(${event.kind}, p${event.priority})`)
    .join("; ");
  const recentSummary = recentSignals
    .slice(0, 3)
    .map((signal) => `${signal.symbol}(p${signal.priority})`)
    .join("; ");

  const prompt =
    locale === "pt-BR"
      ? `Monte um briefing acionável da minha watchlist ${label || ""}. Priorize os ativos mais urgentes, explique o que mudou desde a última leitura e proponha próximos passos para um investidor pessoa física. Eventos ativos: ${activeSummary || "sem eventos relevantes"}. Leituras recentes: ${recentSummary || "sem histórico recente"}.`
      : `Build an actionable briefing for my watchlist ${label || ""}. Prioritize the most urgent assets, explain what changed since the previous read, and propose next steps for a retail investor. Active events: ${activeSummary || "no material active events"}. Recent reads: ${recentSummary || "no recent history"}.`;

  const params = new URLSearchParams({
    channel: "equities",
    audience: "pf",
    open: "1",
    prompt,
  });
  if (cleanSymbols[0]) {
    params.set("asset", cleanSymbols[0]);
  }
  return `/assistant?${params.toString()}`;
}
