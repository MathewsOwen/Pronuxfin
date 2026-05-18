export type EconomicEventRegion = "br" | "global" | "both";
export type EconomicEventImpact = "low" | "medium" | "high";

export type EconomicCalendarEvent = {
  id: string;
  date: string;
  timeUtc: string | null;
  titlePt: string;
  titleEn: string;
  region: EconomicEventRegion;
  impact: EconomicEventImpact;
  category: "macro" | "earnings" | "policy" | "auction" | "holiday";
  /** Evento derivado dos tickers guardados na watchlist do utilizador. */
  watchlistSymbol?: string;
  source?: "fmp" | "curated" | "b3-season" | "watchlist-illustrative";
  epsEstimated?: number | null;
  epsActual?: number | null;
};

/** Eventos recorrentes por dia do mês (1–31) ou dia da semana (0=Dom … 6=Sáb). */
type RecurringRule =
  | { kind: "dom"; dayOfMonth: number }
  | { kind: "dow"; weekday: number };

type RecurringTemplate = Omit<EconomicCalendarEvent, "id" | "date"> & {
  rule: RecurringRule;
};

const RECURRING: RecurringTemplate[] = [
  {
    rule: { kind: "dom", dayOfMonth: 1 },
    timeUtc: "12:00",
    titlePt: "PMI manufatura global (síntese)",
    titleEn: "Global manufacturing PMI (composite read)",
    region: "global",
    impact: "medium",
    category: "macro",
  },
  {
    rule: { kind: "dom", dayOfMonth: 5 },
    timeUtc: "13:30",
    titlePt: "Payroll EUA (quando na primeira sexta do mês — referência)",
    titleEn: "US jobs report (reference slot when first Friday)",
    region: "global",
    impact: "high",
    category: "macro",
  },
  {
    rule: { kind: "dow", weekday: 3 },
    timeUtc: "19:00",
    titlePt: "Decisão de taxa Fed (janelas de reunião FOMC — placeholder semanal)",
    titleEn: "Fed rate decision window (FOMC weeks — weekly placeholder)",
    region: "global",
    impact: "high",
    category: "policy",
  },
  {
    rule: { kind: "dom", dayOfMonth: 10 },
    timeUtc: "11:00",
    titlePt: "IPCA / inflação Brasil (referência ~meio do mês)",
    titleEn: "Brazil CPI (mid-month reference)",
    region: "br",
    impact: "high",
    category: "macro",
  },
  {
    rule: { kind: "dom", dayOfMonth: 15 },
    timeUtc: "17:30",
    titlePt: "Copom / Selic (datas oficiais variam — slot ilustrativo)",
    titleEn: "Brazil Copom / Selic (official dates vary — illustrative slot)",
    region: "br",
    impact: "high",
    category: "policy",
  },
  {
    rule: { kind: "dow", weekday: 5 },
    timeUtc: "20:30",
    titlePt: "Temporada de balanços EUA (picos às sextas)",
    titleEn: "US earnings season (Friday cluster)",
    region: "global",
    impact: "medium",
    category: "earnings",
  },
];

const FIXED_2026: EconomicCalendarEvent[] = [
  {
    id: "2026-01-29-fomc",
    date: "2026-01-29",
    timeUtc: "19:00",
    titlePt: "Reunião FOMC — decisão de juros EUA",
    titleEn: "FOMC meeting — US rate decision",
    region: "global",
    impact: "high",
    category: "policy",
  },
  {
    id: "2026-03-18-fomc",
    date: "2026-03-18",
    timeUtc: "19:00",
    titlePt: "Reunião FOMC — decisão de juros EUA",
    titleEn: "FOMC meeting — US rate decision",
    region: "global",
    impact: "high",
    category: "policy",
  },
  {
    id: "2026-05-07-ecb",
    date: "2026-05-07",
    timeUtc: "13:15",
    titlePt: "BCE — decisão de juros zona euro",
    titleEn: "ECB — euro area rate decision",
    region: "global",
    impact: "high",
    category: "policy",
  },
];

function padDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function expandRecurringForDate(d: Date): EconomicCalendarEvent[] {
  const dom = d.getUTCDate();
  const dow = d.getUTCDay();
  const date = padDate(d);
  const out: EconomicCalendarEvent[] = [];

  for (const tpl of RECURRING) {
    const match =
      tpl.rule.kind === "dom"
        ? tpl.rule.dayOfMonth === dom
        : tpl.rule.weekday === dow;
    if (!match) continue;
    out.push({
      id: `${date}-${tpl.titlePt.slice(0, 12)}`,
      date,
      timeUtc: tpl.timeUtc,
      titlePt: tpl.titlePt,
      titleEn: tpl.titleEn,
      region: tpl.region,
      impact: tpl.impact,
      category: tpl.category,
      source: "curated",
    });
  }
  return out;
}

export function listEconomicCalendarEvents(options?: {
  from?: Date;
  days?: number;
  region?: EconomicEventRegion | "all";
  limit?: number;
}): EconomicCalendarEvent[] {
  const from = options?.from ?? new Date();
  const days = options?.days ?? 14;
  const region = options?.region ?? "all";
  const limit = options?.limit;

  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const byId = new Map<string, EconomicCalendarEvent>();

  for (const fixed of FIXED_2026) {
    const fd = new Date(`${fixed.date}T00:00:00Z`);
    if (fd >= start && fd < new Date(start.getTime() + days * 86_400_000)) {
      byId.set(fixed.id, fixed);
    }
  }

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getTime() + i * 86_400_000);
    for (const ev of expandRecurringForDate(d)) {
      byId.set(ev.id, ev);
    }
  }

  let list = [...byId.values()].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.timeUtc ?? "").localeCompare(b.timeUtc ?? "");
  });

  if (region !== "all") {
    list = list.filter((e) => e.region === region || e.region === "both");
  }

  if (limit != null) list = list.slice(0, limit);
  return list;
}

export function listEconomicCalendarEventsForDay(
  dateIso: string,
  region: EconomicEventRegion | "all" = "all",
  watchlistSymbols: string[] = [],
): EconomicCalendarEvent[] {
  const d = new Date(`${dateIso}T12:00:00Z`);
  const base = listEconomicCalendarEvents({ from: d, days: 1, region });
  const extra = buildWatchlistCalendarEvents(watchlistSymbols, { from: d, days: 1 });
  return mergeEconomicCalendarEvents(base, extra).filter((e) => e.date === dateIso);
}

/** Slots de resultados/divulgação para tickers da watchlist (ilustrativo — confirmar datas oficiais). */
export function buildWatchlistCalendarEvents(
  symbols: string[],
  options?: { from?: Date; days?: number },
): EconomicCalendarEvent[] {
  const from = options?.from ?? new Date();
  const days = Math.max(1, options?.days ?? 14);
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(
    0,
    16,
  );
  const out: EconomicCalendarEvent[] = [];

  for (let i = 0; i < unique.length; i += 1) {
    const symbol = unique[i]!;
    const offset = (i % Math.min(days, 12)) + 1;
    const d = new Date(start.getTime() + offset * 86_400_000);
    const date = padDate(d);
    out.push({
      id: `watchlist-earnings-${symbol}-${date}`,
      date,
      timeUtc: "20:00",
      titlePt: `Janela de resultados — ${symbol} (sua watchlist)`,
      titleEn: `Earnings window — ${symbol} (your watchlist)`,
      region: /\d$/.test(symbol) ? "br" : "global",
      impact: "medium",
      category: "earnings",
      watchlistSymbol: symbol,
      source: "watchlist-illustrative",
    });
  }

  return out;
}

export function mergeEconomicCalendarEvents(
  base: EconomicCalendarEvent[],
  extra: EconomicCalendarEvent[],
): EconomicCalendarEvent[] {
  const byId = new Map<string, EconomicCalendarEvent>();
  for (const ev of [...base, ...extra]) {
    byId.set(ev.id, ev);
  }
  return [...byId.values()].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.timeUtc ?? "").localeCompare(b.timeUtc ?? "");
  });
}
