import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EconomicCalendarView } from "@/components/tools/economic-calendar-view";
import { SeoFaqSection } from "@/components/marketing/seo-faq-section";
import { PageFaqJsonLd } from "@/components/seo/page-faq-json-ld";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { loadEconomicCalendar } from "@/lib/tools/load-economic-calendar";

const CALENDAR_FAQ_KEYS = ["what", "copom", "impact", "account", "sources"] as const;

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
  const t = await getTranslations("LearnTools.calendar");
  const user = await getCurrentUser();
  if (user) redirect("/calendario");

  const { events, fmpAvailable, mode } = await loadEconomicCalendar({
    days: 14,
    watchlistSymbols: [],
  });

  return (
    <>
      <PageFaqJsonLd
        pathname="/ferramentas/calendario"
        namespace="LearnTools.calendar.faq"
        keys={CALENDAR_FAQ_KEYS}
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("pageLead")}</p>
        </header>

        <div className="mt-8">
          <EconomicCalendarView
            loggedIn={false}
            watchlistSymbols={[]}
            serverEvents={events}
            fmpAvailable={fmpAvailable}
            calendarMode={mode}
          />
        </div>

        <section className="mt-12 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-xl font-semibold text-foreground">{t("guideTitle")}</h2>
          <p>{t("guideP1")}</p>
          <p>
            {t("guideLinkLead")}{" "}
            <Link href="/aprenda/copom-e-investimentos" className="text-primary hover:underline">
              {t("guideLinkLabel")}
            </Link>
            .
          </p>
        </section>

        <SeoFaqSection
          namespace="LearnTools.calendar.faq"
          keys={CALENDAR_FAQ_KEYS}
          eyebrow={t("faqEyebrow")}
          title={t("faqTitle")}
          description={t("faqLead")}
          ctaHref="/register"
          ctaLabel={t("faqCta")}
        />
      </div>
    </>
  );
}
