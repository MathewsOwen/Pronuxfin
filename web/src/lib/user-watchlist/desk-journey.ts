export type DeskJourneyStepId = "watchlist" | "calendar" | "dossier";

export type DeskJourneyStep = {
  id: DeskJourneyStepId;
  href: string;
  complete: boolean;
  /** Símbolo em foco no passo dossiê (quando aplicável). */
  symbol?: string;
};

export function buildDeskJourney(input: {
  watchlistCount: number;
  calendarEventsToday: number;
  focusSymbol: string | null;
}): DeskJourneyStep[] {
  const symbol = input.focusSymbol?.trim().toUpperCase() || null;

  return [
    {
      id: "watchlist",
      href: "/compare",
      complete: input.watchlistCount > 0,
    },
    {
      id: "calendar",
      href: "/calendario?mesa=1",
      complete: input.calendarEventsToday > 0,
    },
    {
      id: "dossier",
      href: symbol ? `/ativo/${encodeURIComponent(symbol)}` : "/bolsa",
      complete: Boolean(symbol) && input.watchlistCount > 0,
      symbol: symbol ?? undefined,
    },
  ];
}

export function deskJourneyProgress(steps: DeskJourneyStep[]): {
  completed: number;
  total: number;
} {
  const completed = steps.filter((step) => step.complete).length;
  return { completed, total: steps.length };
}
