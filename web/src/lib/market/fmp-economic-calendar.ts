import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { isFmpProviderEnabled } from "@/lib/market/fmp-config";
import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import { rememberWithTtl } from "@/lib/market/market-server-cache";
import type {
  EconomicCalendarEvent,
  EconomicEventImpact,
  EconomicEventRegion,
} from "@/lib/tools/economic-calendar";

type FmpMacroRow = {
  event?: string;
  date?: string;
  country?: string;
  impact?: string;
  time?: string;
};

const FMP_MACRO_TTL_MS = 15 * 60_000;

async function fmpEnabled() {
  return isFmpProviderEnabled() && (await canUseMarketProvider("financial_modeling_prep"));
}

function padDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mapImpact(raw: string | undefined): EconomicEventImpact {
  const u = (raw ?? "").toLowerCase();
  if (u.includes("high")) return "high";
  if (u.includes("low")) return "low";
  return "medium";
}

function mapRegion(country: string | undefined): EconomicEventRegion {
  const c = (country ?? "").toUpperCase();
  if (c === "BR" || c === "BRA" || c === "BRAZIL") return "br";
  return "global";
}

function slugId(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 48);
}

function mapRowToEvent(row: FmpMacroRow): EconomicCalendarEvent | null {
  const date =
    typeof row.date === "string" && row.date.length >= 10 ? row.date.slice(0, 10) : "";
  const title =
    typeof row.event === "string" && row.event.trim() ? row.event.trim() : "";
  if (!date || !title) return null;

  const region = mapRegion(row.country);
  const impact = mapImpact(row.impact);

  return {
    id: `fmp-macro-${slugId(title)}-${date}`,
    date,
    timeUtc: typeof row.time === "string" && row.time ? row.time : "14:00",
    titlePt: title,
    titleEn: title,
    region,
    impact,
    category: "macro",
    source: "fmp",
  };
}

async function fetchFmpMacroCalendarRaw(
  fromIso: string,
  toIso: string,
): Promise<FmpMacroRow[] | null> {
  if (!(await fmpEnabled())) return null;

  const apiKey =
    process.env.FMP_API_KEY?.trim() ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim() ||
    "";

  try {
    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${encodeURIComponent(
      fromIso,
    )}&to=${encodeURIComponent(toIso)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetchMarket(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PRONUXFIN/1.0 (+https://pronuxfin.com.br; institutional economic calendar)",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fmp_macro_status_${res.status}`);
    const json = (await res.json()) as FmpMacroRow[];
    if (!Array.isArray(json)) return null;
    await noteMarketProviderUsage("financial_modeling_prep");
    return json;
  } catch {
    return null;
  }
}

export async function fetchFmpMacroCalendarEvents(options: {
  days: number;
  limit?: number;
}): Promise<{ events: EconomicCalendarEvent[]; available: boolean }> {
  const days = Math.max(1, Math.min(options.days, 45));
  const start = new Date();
  const from = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const end = new Date(from.getTime() + days * 86_400_000);
  const fromIso = padDate(from);
  const toIso = padDate(end);
  const cacheKey = `fmp-macro:${fromIso}:${toIso}`;

  return rememberWithTtl(cacheKey, FMP_MACRO_TTL_MS, async () => {
    const raw = await fetchFmpMacroCalendarRaw(fromIso, toIso);
    if (!raw) return { events: [], available: false };

    const limit = options.limit ?? 80;
    const events: EconomicCalendarEvent[] = [];
    for (const row of raw.slice(0, limit * 2)) {
      const ev = mapRowToEvent(row);
      if (ev) events.push(ev);
      if (events.length >= limit) break;
    }

    return { events, available: true };
  });
}
