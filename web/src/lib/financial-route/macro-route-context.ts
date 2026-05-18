import { loadEconomicCalendar } from "@/lib/tools/load-economic-calendar";
import type { EconomicCalendarEvent } from "@/lib/tools/economic-calendar";
import { listUserPortfolioPositions } from "@/lib/user-portfolio/load";
import { listUserWatchlist } from "@/lib/user-watchlist/load";

export type MacroRouteEvent = {
  id: string;
  date: string;
  titlePt: string;
  titleEn: string;
  region: string;
  category: string;
  impact: string;
};

export type MacroRouteContext = {
  referenceInflationPct: number;
  upcomingHighImpact: MacroRouteEvent[];
  hasHighImpactToday: boolean;
  hasHighImpactThisWeek: boolean;
  eventSummaryPt: string;
  eventSummaryEn: string;
};

const BASE_INFLATION_REF = 5.5;

function padToday() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromToday(dateIso: string) {
  const today = new Date(`${padToday()}T12:00:00Z`).getTime();
  const target = new Date(`${dateIso.slice(0, 10)}T12:00:00Z`).getTime();
  return Math.round((target - today) / 86_400_000);
}

function isMacroRelevant(ev: EconomicCalendarEvent) {
  return (
    (ev.category === "macro" || ev.category === "policy") &&
    (ev.impact === "high" || ev.impact === "medium")
  );
}

function mapEvent(ev: EconomicCalendarEvent): MacroRouteEvent {
  return {
    id: ev.id,
    date: ev.date,
    titlePt: ev.titlePt,
    titleEn: ev.titleEn,
    region: ev.region,
    category: ev.category,
    impact: ev.impact,
  };
}

function deriveInflationReference(events: MacroRouteEvent[]) {
  let ref = BASE_INFLATION_REF;
  for (const ev of events) {
    const t = `${ev.titlePt} ${ev.titleEn}`.toLowerCase();
    if (t.includes("ipca") || t.includes("infla") || t.includes("cpi")) {
      ref = Math.max(ref, BASE_INFLATION_REF + 1.2);
    }
    if (t.includes("copom") || t.includes("selic") || t.includes("fomc") || t.includes("fed")) {
      ref = Math.max(ref, BASE_INFLATION_REF + 0.6);
    }
  }
  return Math.min(9, Math.round(ref * 10) / 10);
}

function summarizeEvents(events: MacroRouteEvent[], locale: "pt" | "en") {
  if (events.length === 0) {
    return locale === "pt" ? "Sem eventos macro de alto impacto na janela." : "No high-impact macro events in the window.";
  }
  const titles = events.slice(0, 3).map((e) => (locale === "pt" ? e.titlePt : e.titleEn));
  const more = events.length > 3 ? (locale === "pt" ? ` +${events.length - 3}` : ` +${events.length - 3}`) : "";
  return titles.join(" · ") + more;
}

export function buildMacroRouteContextFromEvents(
  events: EconomicCalendarEvent[],
  options?: { horizonDays?: number },
): MacroRouteContext {
  const horizon = options?.horizonDays ?? 14;
  const relevant = events
    .filter(isMacroRelevant)
    .filter((ev) => {
      const d = daysFromToday(ev.date);
      return d >= 0 && d <= horizon;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(mapEvent);

  const today = padToday();

  const upcomingHighImpact = relevant.filter((e) => e.impact === "high");
  const hasHighImpactToday = upcomingHighImpact.some((e) => e.date === today);
  const hasHighImpactThisWeek = upcomingHighImpact.some((e) => daysFromToday(e.date) <= 7);

  return {
    referenceInflationPct: deriveInflationReference(upcomingHighImpact.length > 0 ? upcomingHighImpact : relevant),
    upcomingHighImpact,
    hasHighImpactToday,
    hasHighImpactThisWeek,
    eventSummaryPt: summarizeEvents(upcomingHighImpact.length > 0 ? upcomingHighImpact : relevant, "pt"),
    eventSummaryEn: summarizeEvents(upcomingHighImpact.length > 0 ? upcomingHighImpact : relevant, "en"),
  };
}

/** Agenda macro + watchlist para recalcular premissas das rotas do utilizador. */
export async function loadMacroRouteContextForUser(userId: string): Promise<MacroRouteContext> {
  const [watchlist, portfolio] = await Promise.all([
    listUserWatchlist(userId),
    listUserPortfolioPositions(userId),
  ]);

  const deskSymbols = [
    ...new Set([...watchlist.map((w) => w.symbol), ...portfolio.map((p) => p.symbol)]),
  ];

  const { events } = await loadEconomicCalendar({
    days: 14,
    watchlistSymbols: deskSymbols,
  });

  return buildMacroRouteContextFromEvents(events, { horizonDays: 14 });
}
