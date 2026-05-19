import { ArrowRight, CalendarDays, Check, FileSearch, ListChecks } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  buildDeskJourney,
  deskJourneyProgress,
  type DeskJourneyStepId,
} from "@/lib/user-watchlist/desk-journey";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<DeskJourneyStepId, typeof ListChecks> = {
  watchlist: ListChecks,
  calendar: CalendarDays,
  dossier: FileSearch,
};

export async function DeskJourneyStrip({
  watchlistCount,
  calendarEventsToday,
  focusSymbol,
}: {
  watchlistCount: number;
  calendarEventsToday: number;
  focusSymbol: string | null;
}) {
  const t = await getTranslations("Dashboard");
  const steps = buildDeskJourney({ watchlistCount, calendarEventsToday, focusSymbol });
  const { completed, total } = deskJourneyProgress(steps);

  const titleKeys: Record<DeskJourneyStepId, string> = {
    watchlist: "deskJourneyWatchlistTitle",
    calendar: "deskJourneyCalendarTitle",
    dossier: "deskJourneyDossierTitle",
  };
  const leadKeys: Record<DeskJourneyStepId, string> = {
    watchlist: "deskJourneyWatchlistLead",
    calendar: "deskJourneyCalendarLead",
    dossier: "deskJourneyDossierLead",
  };
  const ctaKeys: Record<DeskJourneyStepId, string> = {
    watchlist: "deskJourneyWatchlistCta",
    calendar: "deskJourneyCalendarCta",
    dossier: "deskJourneyDossierCta",
  };

  return (
    <section
      id="mesa-fluxo"
      className="scroll-mt-24 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,color-mix(in oklch, var(--cognitive) 12%, transparent),oklch(0.14_0.02_258))] px-5 py-6 md:px-7"
      aria-labelledby="desk-journey-title"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cognitive/90">
            {t("deskJourneyEyebrow")}
          </p>
          <h2 id="desk-journey-title" className="font-heading mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            {t("deskJourneyTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("deskJourneyLead")}
          </p>
        </div>
        <p className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("deskJourneyProgress", { completed, total })}
        </p>
      </header>

      <ol className="mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id];
          const titleKey = titleKeys[step.id];
          const leadKey = leadKeys[step.id];
          const ctaKey = ctaKeys[step.id];
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border px-4 py-4 transition-colors",
                  step.complete
                    ? "border-primary/25 bg-primary/8 hover:border-primary/35"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl border",
                      step.complete
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/[0.04] text-muted-foreground",
                    )}
                  >
                    {step.complete ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Icon className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {t("deskJourneyStep", { step: index + 1 })}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {step.id === "dossier" && step.symbol
                    ? t("deskJourneyDossierTitleFocus", { symbol: step.symbol })
                    : t(titleKey)}
                </p>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {t(leadKey)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {t(ctaKey)}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
