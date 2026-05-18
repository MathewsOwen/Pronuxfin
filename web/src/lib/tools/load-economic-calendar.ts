import { fetchFmpEarningsCalendarEvents } from "@/lib/market/fmp-earnings-calendar";
import { fetchFmpMacroCalendarEvents } from "@/lib/market/fmp-economic-calendar";
import { buildB3EarningsSeasonEvents } from "@/lib/tools/b3-earnings-season";
import {
  listEconomicCalendarEvents,
  listFixedMacroCalendarEvents,
  mergeEconomicCalendarEvents,
  type EconomicCalendarEvent,
  type EconomicEventRegion,
} from "@/lib/tools/economic-calendar";

function isB3Symbol(symbol: string) {
  return /\d$/.test(symbol.trim());
}

export type EconomicCalendarMode = "live" | "curated" | "hybrid";

export type LoadedEconomicCalendar = {
  events: EconomicCalendarEvent[];
  fmpAvailable: boolean;
  mode: EconomicCalendarMode;
  fmpEarningsCount: number;
  fmpMacroCount: number;
};

export async function loadEconomicCalendar(options: {
  days: number;
  watchlistSymbols?: string[];
  region?: EconomicEventRegion | "all";
  limit?: number;
}): Promise<LoadedEconomicCalendar> {
  const days = options.days;
  const watchlist = options.watchlistSymbols ?? [];

  const [fmpEarnings, fmpMacro] = await Promise.all([
    fetchFmpEarningsCalendarEvents({
      days,
      watchlistSymbols: watchlist.length > 0 ? watchlist : undefined,
      publicLimit: watchlist.length > 0 ? undefined : 80,
    }),
    fetchFmpMacroCalendarEvents({ days, limit: 60 }),
  ]);

  const fmpAvailable = fmpEarnings.available || fmpMacro.available;

  let events = listFixedMacroCalendarEvents({
    days,
    region: options.region ?? "all",
  });

  events = mergeEconomicCalendarEvents(events, fmpMacro.events, fmpEarnings.events);

  if (!fmpAvailable) {
    events = mergeEconomicCalendarEvents(
      events,
      listEconomicCalendarEvents({
        days,
        region: options.region ?? "all",
        includeRecurring: true,
      }),
    );
  }

  const fmpSymbols = new Set<string>();
  for (const ev of fmpEarnings.events) {
    if (ev.watchlistSymbol) fmpSymbols.add(ev.watchlistSymbol);
    else {
      const match = ev.id.match(/^fmp-earnings-([A-Z0-9.-]+)-/);
      if (match?.[1]) fmpSymbols.add(match[1]);
    }
  }

  const withoutFmp = watchlist
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s && !fmpSymbols.has(s));

  if (withoutFmp.filter(isB3Symbol).length > 0) {
    events = mergeEconomicCalendarEvents(
      events,
      buildB3EarningsSeasonEvents(withoutFmp.filter(isB3Symbol), { days }),
    );
  }

  if (options.region && options.region !== "all") {
    events = events.filter((e) => e.region === options.region || e.region === "both");
  }

  if (options.limit != null) {
    events = events.slice(0, options.limit);
  }

  const fmpEarningsCount = events.filter(
    (e) => e.source === "fmp" && e.category === "earnings",
  ).length;
  const fmpMacroCount = events.filter((e) => e.source === "fmp" && e.category === "macro").length;
  const fmpTotal = fmpEarningsCount + fmpMacroCount;

  const mode: EconomicCalendarMode =
    fmpAvailable && fmpTotal >= 5
      ? "live"
      : fmpAvailable && fmpTotal > 0
        ? "hybrid"
        : "curated";

  return {
    events,
    fmpAvailable,
    mode,
    fmpEarningsCount,
    fmpMacroCount,
  };
}
