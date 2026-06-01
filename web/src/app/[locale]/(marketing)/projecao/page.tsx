import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProjecaoHubLoader } from "@/components/market/projecao-hub-loader";
import { PageFaqJsonLd } from "@/components/seo/page-faq-json-ld";
import { SeoFaqSection } from "@/components/marketing/seo-faq-section";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

const PROJECAO_FAQ_KEYS = ["what", "scenarios", "account", "advice"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.projecao");
  return marketingMetadata({
    pathname: "/projecao",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default async function ProjecaoPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("LearnTools.projecao");

  return (
    <>
      <PageFaqJsonLd
        pathname="/projecao"
        namespace="LearnTools.projecao.faq"
        keys={PROJECAO_FAQ_KEYS}
      />
      <ProjecaoHubLoader loggedIn={Boolean(user)} />
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <SeoFaqSection
          namespace="LearnTools.projecao.faq"
          keys={PROJECAO_FAQ_KEYS}
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
