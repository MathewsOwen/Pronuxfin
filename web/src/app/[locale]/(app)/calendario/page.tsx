import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EconomicCalendarView } from "@/components/tools/economic-calendar-view";
import type { AppLocale } from "@/i18n/routing";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import {
  evaluateUserFinancialRoutes,
  listUserFinancialRoutes,
  syncRouteAlerts,
} from "@/lib/financial-route/load";
import { loadEconomicCalendar } from "@/lib/tools/load-economic-calendar";
import { listUserPortfolioPositions } from "@/lib/user-portfolio/load";
import { listUserWatchlist } from "@/lib/user-watchlist/load";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Tools.calendar");
  return privateAppMetadata({
    pathname: "/calendario",
    title: t("fullPageTitle"),
    description: t("fullPageLead"),
    locale,
  });
}

type CalendarioPageProps = {
  searchParams: Promise<{ mesa?: string }>;
};

export default async function AppCalendarPage({ searchParams }: CalendarioPageProps) {
  const t = await getTranslations("Tools.calendar");
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=%2Fcalendario");
  const query = await searchParams;
  const initialWatchlistOnly = query.mesa === "1";

  const [watchlistItems, portfolioPositions] = await Promise.all([
    listUserWatchlist(user.id),
    listUserPortfolioPositions(user.id),
  ]);

  const deskSymbols = [
    ...new Set([
      ...watchlistItems.map((item) => item.symbol),
      ...portfolioPositions.map((p) => p.symbol),
    ]),
  ];

  const { events, fmpAvailable, mode } = await loadEconomicCalendar({
    days: 30,
    watchlistSymbols: deskSymbols,
  });

  const routes = await listUserFinancialRoutes(user.id);
  if (routes.length > 0) {
    const evaluated = await evaluateUserFinancialRoutes(user.id);
    await syncRouteAlerts(user.id, evaluated);
  }
  const tRoute = await getTranslations("FinancialRoute");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("fullPageTitle")}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{t("fullPageLead")}</p>
      </div>

      {routes.length > 0 ? (
        <p className="rounded-2xl border border-cognitive/25 bg-cognitive/8 px-4 py-3 text-sm text-cognitive">
          {t("routeSyncHint")}{" "}
          <Link href="/rota" className="font-semibold text-cognitive underline underline-offset-2 hover:text-cognitive">
            {tRoute("macroBannerCta")}
          </Link>
        </p>
      ) : null}

      <EconomicCalendarView
        loggedIn
        watchlistSymbols={deskSymbols}
        serverEvents={events}
        fmpAvailable={fmpAvailable}
        calendarMode={mode}
        groupByDay
        showWatchlistFilter
        initialWatchlistOnly={initialWatchlistOnly}
      />
    </div>
  );
}

