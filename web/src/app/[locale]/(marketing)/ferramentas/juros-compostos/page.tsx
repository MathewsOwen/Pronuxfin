import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CompoundInterestCalculator } from "@/components/tools/compound-interest-calculator";
import { SeoFaqSection } from "@/components/marketing/seo-faq-section";
import { PageFaqJsonLd } from "@/components/seo/page-faq-json-ld";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

const COMPOUND_FAQ_KEYS = ["what", "formula", "rate", "taxes", "save"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.compound");
  return marketingMetadata({
    pathname: "/ferramentas/juros-compostos",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default async function CompoundInterestPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("LearnTools.compound");

  return (
    <>
      <PageFaqJsonLd
        pathname="/ferramentas/juros-compostos"
        namespace="LearnTools.compound.faq"
        keys={COMPOUND_FAQ_KEYS}
      />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <header className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("pageLead")}</p>
        </header>

        <div className="mt-10">
          <CompoundInterestCalculator loggedIn={Boolean(user)} />
        </div>

        <section className="mt-12 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-xl font-semibold text-foreground">{t("guideTitle")}</h2>
          <p>{t("guideP1")}</p>
          <p>{t("guideP2")}</p>
          <p>
            {t("guideLinkLead")}{" "}
            <Link href="/aprenda/juros-compostos-guia" className="text-primary hover:underline">
              {t("guideLinkLabel")}
            </Link>
            .
          </p>
        </section>

        <SeoFaqSection
          namespace="LearnTools.compound.faq"
          keys={COMPOUND_FAQ_KEYS}
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
