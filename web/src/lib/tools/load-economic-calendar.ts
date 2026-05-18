import { fetchFmpEarningsCalendarEvents } from "@/lib/market/fmp-earnings-calendar";
import { buildB3EarningsSeasonEvents } from "@/lib/tools/b3-earnings-season";
import {
  buildWatchlistCalendarEvents,
  listEconomicCalendarEvents,
  mergeEconomicCalendarEvents,
  type EconomicCalendarEvent,
  type EconomicEventRegion,
} from "@/lib/tools/economic-calendar";

function isB3Symbol(symbol: string) {
  return /\d$/.test(symbol.trim());
}

export type LoadedEconomicCalendar = {
  events: EconomicCalendarEvent[];
  fmpAvailable: boolean;
};

export async function loadEconomicCalendar(options: {
  days: number;
  watchlistSymbols?: string[];
  region?: EconomicEventRegion | "all";
  limit?: number;
}): Promise<LoadedEconomicCalendar> {
  const days = options.days;
  const watchlist = options.watchlistSymbols ?? [];

  const base = listEconomicCalendarEvents({ days, region: options.region ?? "all" });
  const fmp = await fetchFmpEarningsCalendarEvents({
    days,
    watchlistSymbols: watchlist.length > 0 ? watchlist : undefined,
    publicLimit: watchlist.length > 0 ? undefined : 60,
  });

  const fmpSymbols = new Set<string>();
  for (const ev of fmp.events) {
    if (ev.watchlistSymbol) fmpSymbols.add(ev.watchlistSymbol);
    else {
      const match = ev.id.match(/^fmp-earnings-([A-Z0-9.-]+)-/);
      if (match?.[1]) fmpSymbols.add(match[1]);
    }
  }

  const withoutFmp = watchlist
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s && !fmpSymbols.has(s));

  const b3Season =
    withoutFmp.filter(isB3Symbol).length > 0
      ? buildB3EarningsSeasonEvents(withoutFmp.filter(isB3Symbol), { days })
      : [];

  const illustrative =
    withoutFmp.filter((s) => !isB3Symbol(s)).length > 0
      ? buildWatchlistCalendarEvents(withoutFmp.filter((s) => !isB3Symbol(s)), { days })
      : [];

  let events = mergeEconomicCalendarEvents(
    mergeEconomicCalendarEvents(mergeEconomicCalendarEvents(base, fmp.events), b3Season),
    illustrative,
  );

  if (options.region && options.region !== "all") {
    events = events.filter((e) => e.region === options.region || e.region === "both");
  }

  if (options.limit != null) {
    events = events.slice(0, options.limit);
  }

  return { events, fmpAvailable: fmp.available };
}
