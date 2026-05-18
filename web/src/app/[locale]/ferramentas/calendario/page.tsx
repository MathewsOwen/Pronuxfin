import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { EconomicCalendarView } from "@/components/tools/economic-calendar-view";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { loadEconomicCalendar } from "@/lib/tools/load-economic-calendar";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.calendar");
  return marketingMetadata({
    pathname: "/ferramentas/calendario",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default async function EconomicCalendarPage() {
  const t = await getTranslations("Tools.calendar");
  const user = await getCurrentUser();
  if (user) redirect("/calendario");

  const { events, fmpAvailable } = await loadEconomicCalendar({
    days: 14,
    watchlistSymbols: [],
  });

  return (
    <MarketingShell ticker>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t("pageLead")}</p>
        <div className="mt-8">
          <EconomicCalendarView
            loggedIn={false}
            watchlistSymbols={[]}
            serverEvents={events}
            fmpAvailable={fmpAvailable}
          />
        </div>
      </div>
    </MarketingShell>
  );
}
