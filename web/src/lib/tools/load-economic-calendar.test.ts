import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EconomicCalendarEvent } from "@/lib/tools/economic-calendar";
import { loadEconomicCalendar } from "@/lib/tools/load-economic-calendar";

vi.mock("@/lib/market/fmp-earnings-calendar", () => ({
  fetchFmpEarningsCalendarEvents: vi.fn(),
}));

vi.mock("@/lib/market/fmp-economic-calendar", () => ({
  fetchFmpMacroCalendarEvents: vi.fn(),
}));

import { fetchFmpEarningsCalendarEvents } from "@/lib/market/fmp-earnings-calendar";
import { fetchFmpMacroCalendarEvents } from "@/lib/market/fmp-economic-calendar";

function fmpEvent(
  partial: Pick<EconomicCalendarEvent, "id" | "date" | "category"> &
    Partial<EconomicCalendarEvent>,
): EconomicCalendarEvent {
  return {
    timeUtc: "13:30",
    titlePt: partial.titlePt ?? "Evento FMP",
    titleEn: partial.titleEn ?? "FMP event",
    region: "global",
    impact: "medium",
    source: "fmp",
    ...partial,
  };
}

describe("loadEconomicCalendar", () => {
  beforeEach(() => {
    vi.mocked(fetchFmpEarningsCalendarEvents).mockResolvedValue({
      available: false,
      events: [],
    });
    vi.mocked(fetchFmpMacroCalendarEvents).mockResolvedValue({
      available: false,
      events: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses curated mode and recurring slots when FMP is unavailable", async () => {
    const result = await loadEconomicCalendar({ days: 30 });

    expect(result.fmpAvailable).toBe(false);
    expect(result.mode).toBe("curated");
    expect(result.events.some((e) => e.source === "curated" || !e.source)).toBe(true);
  });

  it("uses live mode when FMP returns enough events", async () => {
    const macro = Array.from({ length: 3 }, (_, i) =>
      fmpEvent({
        id: `fmp-macro-${i}`,
        date: "2026-05-20",
        category: "macro",
      }),
    );
    const earnings = Array.from({ length: 3 }, (_, i) =>
      fmpEvent({
        id: `fmp-earnings-TICK${i}-2026-05-21`,
        date: "2026-05-21",
        category: "earnings",
      }),
    );

    vi.mocked(fetchFmpMacroCalendarEvents).mockResolvedValue({
      available: true,
      events: macro,
    });
    vi.mocked(fetchFmpEarningsCalendarEvents).mockResolvedValue({
      available: true,
      events: earnings,
    });

    const result = await loadEconomicCalendar({ days: 30 });

    expect(result.mode).toBe("live");
    expect(result.fmpMacroCount).toBe(3);
    expect(result.fmpEarningsCount).toBe(3);
    expect(result.events.filter((e) => e.source === "fmp").length).toBeGreaterThanOrEqual(6);
  });

  it("uses hybrid mode when FMP returns a small batch", async () => {
    vi.mocked(fetchFmpMacroCalendarEvents).mockResolvedValue({
      available: true,
      events: [
        fmpEvent({ id: "fmp-macro-1", date: "2026-05-18", category: "macro" }),
      ],
    });
    vi.mocked(fetchFmpEarningsCalendarEvents).mockResolvedValue({
      available: true,
      events: [],
    });

    const result = await loadEconomicCalendar({ days: 30 });

    expect(result.mode).toBe("hybrid");
    expect(result.fmpAvailable).toBe(true);
  });
});
