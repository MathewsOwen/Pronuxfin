"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  buildWatchlistCalendarEvents,
  listEconomicCalendarEvents,
  mergeEconomicCalendarEvents,
  type EconomicCalendarEvent,
  type EconomicEventRegion,
} from "@/lib/tools/economic-calendar";
import { cn } from "@/lib/utils";

export function EconomicCalendarView({
  previewLimit,
  loggedIn = false,
  watchlistSymbols = [],
  serverEvents,
  fmpAvailable = false,
  calendarMode = "curated",
  groupByDay = false,
  showWatchlistFilter = false,
}: {
  previewLimit?: number;
  loggedIn?: boolean;
  watchlistSymbols?: string[];
  /** Quando definido (SSR), substitui o merge só-cliente. */
  serverEvents?: EconomicCalendarEvent[];
  fmpAvailable?: boolean;
  calendarMode?: "live" | "curated" | "hybrid";
  groupByDay?: boolean;
  showWatchlistFilter?: boolean;
}) {
  const t = useTranslations("Tools.calendar");
  const locale = useLocale();
  const [region, setRegion] = useState<EconomicEventRegion | "all">("all");
  const [watchlistOnly, setWatchlistOnly] = useState(false);

  const events = useMemo(() => {
    let list: EconomicCalendarEvent[];
    if (serverEvents) {
      list = serverEvents;
    } else {
      const days = loggedIn ? 21 : 14;
      const base = listEconomicCalendarEvents({ days });
      const extra =
        watchlistSymbols.length > 0
          ? buildWatchlistCalendarEvents(watchlistSymbols, { days })
          : [];
      list = mergeEconomicCalendarEvents(base, extra);
    }

    if (region !== "all") {
      list = list.filter((e) => e.region === region || e.region === "both");
    }

    if (watchlistOnly && watchlistSymbols.length > 0) {
      const desk = new Set(watchlistSymbols.map((s) => s.trim().toUpperCase()));
      list = list.filter((e) => e.watchlistSymbol != null && desk.has(e.watchlistSymbol));
    }

    if (previewLimit != null) return list.slice(0, previewLimit);
    return list;
  }, [loggedIn, previewLimit, region, serverEvents, watchlistOnly, watchlistSymbols]);

  const groupedByDay = useMemo(() => {
    if (!groupByDay) return null;
    const map = new Map<string, EconomicCalendarEvent[]>();
    for (const ev of events) {
      const bucket = map.get(ev.date) ?? [];
      bucket.push(ev);
      map.set(ev.date, bucket);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events, groupByDay]);

  const titleFor = (ev: EconomicCalendarEvent) =>
    locale.startsWith("pt") ? ev.titlePt : ev.titleEn;

  const eventCountLabel = t("eventCount", { count: events.length });

  return (
    <div className="space-y-4">
      {calendarMode === "live" ? (
        <p className="text-xs text-market-up/90">{t("modeLive")}</p>
      ) : calendarMode === "hybrid" ? (
        <p className="text-xs text-market-up/90">{t("modeHybrid")}</p>
      ) : calendarMode === "curated" ? (
        <p className="text-xs text-status-warning/90">{t("modeCurated")}</p>
      ) : fmpAvailable ? (
        <p className="text-xs text-market-up/90">{t("fmpLiveHint")}</p>
      ) : null}
      {loggedIn && watchlistSymbols.some((s) => /\d$/.test(s.trim())) ? (
        <p className="text-xs text-cognitive/90">{t("b3SeasonHint")}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "br", "global"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRegion(key)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              region === key && "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            {t(`filter.${key}`)}
          </button>
        ))}
        {showWatchlistFilter && watchlistSymbols.length > 0 ? (
          <button
            type="button"
            onClick={() => setWatchlistOnly((v) => !v)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              watchlistOnly && "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            {t("filter.watchlist")}
          </button>
        ) : null}
        {groupByDay && events.length > 0 ? (
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">{eventCountLabel}</span>
        ) : null}
      </div>

      {!loggedIn && previewLimit ? (
        <p className="text-xs text-muted-foreground">
          {t("previewHint")}{" "}
          <Link href="/login?from=%2Fcalendario" className="text-primary hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      ) : null}

      {events.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-muted-foreground">
          {watchlistOnly ? t("emptyWatchlist") : t("empty")}
        </div>
      ) : groupByDay && groupedByDay ? (
        <div className="space-y-6">
          {groupedByDay.map(([date, dayEvents]) => (
            <section key={date}>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {formatDayHeading(date, locale)}
              </h2>
              <ul className="mt-2 space-y-2">
                {dayEvents.map((ev) => (
                  <CalendarEventRow
                    key={ev.id}
                    ev={ev}
                    loggedIn={loggedIn}
                    locale={locale}
                    title={titleFor(ev)}
                    t={t}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => (
            <CalendarEventRow
              key={ev.id}
              ev={ev}
              loggedIn={loggedIn}
              locale={locale}
              title={titleFor(ev)}
              t={t}
            />
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}

function CalendarEventRow({
  ev,
  loggedIn,
  locale,
  title,
  t,
}: {
  ev: EconomicCalendarEvent;
  loggedIn: boolean;
  locale: string;
  title: string;
  t: (key: string) => string;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {ev.watchlistSymbol && loggedIn ? (
          <Link
            href={`/ativo/${encodeURIComponent(ev.watchlistSymbol)}`}
            className="font-medium text-foreground hover:text-primary"
          >
            {title}
          </Link>
        ) : (
          <p className="font-medium text-foreground">{title}</p>
        )}
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {formatEventDate(ev.date, ev.timeUtc, locale)}
        </p>
        {formatEpsLine(ev, locale) ? (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {formatEpsLine(ev, locale)}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {ev.source === "curated" ? (
          <Badge className="border-white/15 bg-white/5 font-mono text-[10px] uppercase text-muted-foreground">
            {t("curatedBadge")}
          </Badge>
        ) : null}
        {ev.source === "fmp" ? (
          <Badge className="border-status-live/30 bg-status-live/10 font-mono text-[10px] uppercase text-status-live">
            {t("fmpBadge")}
          </Badge>
        ) : null}
        {ev.source === "b3-season" ? (
          <Badge className="border-cognitive/30 bg-cognitive/10 font-mono text-[10px] uppercase text-cognitive">
            {t("b3SeasonBadge")}
          </Badge>
        ) : null}
        {ev.watchlistSymbol ? (
          <Badge className="border-primary/30 bg-primary/10 font-mono text-[10px] uppercase text-primary">
            {t("watchlistBadge")}
          </Badge>
        ) : null}
        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
          {t(`region.${ev.region}`)}
        </Badge>
        <Badge
          className={cn(
            "font-mono text-[10px] uppercase",
            ev.impact === "high"
              ? "border-status-degraded/30 bg-status-degraded/10 text-status-degraded"
              : ev.impact === "medium"
                ? "border-border bg-primary/8 text-status-warning"
                : "border-white/10 bg-white/5 text-muted-foreground",
          )}
        >
          {t(`impact.${ev.impact}`)}
        </Badge>
      </div>
    </li>
  );
}

function formatDayHeading(date: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(`${date}T12:00:00Z`));
  } catch {
    return date;
  }
}

function formatEventDate(date: string, timeUtc: string | null, locale: string) {
  const base = new Date(`${date}T${timeUtc ?? "12:00"}:00Z`);
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(timeUtc ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC" } : {}),
    }).format(base);
  } catch {
    return date;
  }
}

function formatEpsLine(ev: EconomicCalendarEvent, locale: string) {
  if (ev.epsEstimated == null && ev.epsActual == null) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n);
  const parts: string[] = [];
  if (ev.epsEstimated != null) parts.push(`EPS est. ${fmt(ev.epsEstimated)}`);
  if (ev.epsActual != null) parts.push(`EPS ${fmt(ev.epsActual)}`);
  return parts.join(" · ");
}
