import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { AmortizationCalculator } from "@/components/tools/amortization-calculator";
import { SeoFaqSection } from "@/components/marketing/seo-faq-section";
import { PageFaqJsonLd } from "@/components/seo/page-faq-json-ld";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { decodeAmortizationShare } from "@/lib/tools/amortization-share";

const AMORTIZATION_FAQ_KEYS = ["what", "sacPrice", "extra", "credit", "advice"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.amortization");
  return marketingMetadata({
    pathname: "/ferramentas/amortizacao",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default async function AmortizationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("LearnTools.amortization");
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const initialInput = decodeAmortizationShare(query.toString());

  return (
    <>
      <PageFaqJsonLd
        pathname="/ferramentas/amortizacao"
        namespace="LearnTools.amortization.faq"
        keys={AMORTIZATION_FAQ_KEYS}
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <header className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("pageLead")}</p>
        </header>

        <div className="mt-10">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />}>
            <AmortizationCalculator initialInput={initialInput ?? undefined} />
          </Suspense>
        </div>

        <section className="mt-12 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-xl font-semibold text-foreground">{t("guideTitle")}</h2>
          <p>{t("guideP1")}</p>
          <p>{t("guideP2")}</p>
        </section>

        <SeoFaqSection
          namespace="LearnTools.amortization.faq"
          keys={AMORTIZATION_FAQ_KEYS}
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
