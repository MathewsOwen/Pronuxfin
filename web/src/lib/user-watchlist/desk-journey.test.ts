import { describe, expect, it } from "vitest";

import { buildDeskJourney, deskJourneyProgress } from "./desk-journey";

describe("buildDeskJourney", () => {
  it("marks watchlist complete when symbols exist", () => {
    const steps = buildDeskJourney({
      watchlistCount: 2,
      calendarEventsToday: 0,
      focusSymbol: "PETR4",
    });
    expect(steps[0]?.complete).toBe(true);
    expect(steps[0]?.href).toBe("/compare");
  });

  it("links dossier to focus symbol when provided", () => {
    const steps = buildDeskJourney({
      watchlistCount: 1,
      calendarEventsToday: 1,
      focusSymbol: "VALE3",
    });
    expect(steps[2]?.href).toBe("/ativo/VALE3");
    expect(steps[2]?.symbol).toBe("VALE3");
  });

  it("falls back to market desk without focus symbol", () => {
    const steps = buildDeskJourney({
      watchlistCount: 0,
      calendarEventsToday: 0,
      focusSymbol: null,
    });
    expect(steps[2]?.href).toBe("/bolsa");
    expect(steps[2]?.complete).toBe(false);
  });
});

describe("deskJourneyProgress", () => {
  it("counts completed steps", () => {
    const steps = buildDeskJourney({
      watchlistCount: 3,
      calendarEventsToday: 2,
      focusSymbol: "ITUB4",
    });
    expect(deskJourneyProgress(steps)).toEqual({ completed: 3, total: 3 });
  });
});
