import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  BenefitsSection,
  CtaSection,
  DashboardMockSection,
  FeaturesSection,
  IaSection,
} from "@/components/marketing/landing-sections";
import { ToolsPreviewSection } from "@/components/marketing/tools-preview-section";
import { Hero } from "@/components/marketing/hero";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { CryptoCoverageSection } from "@/components/marketing/crypto-coverage-section";
import { InstitutionalRibbon } from "@/components/marketing/institutional-ribbon";
import { TrustStrip } from "@/components/marketing/trust-strip";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo");
  return marketingMetadata({
    pathname: "/",
    absoluteTitle: true,
    title: t("home.absoluteTitle"),
    description: t("home.description"),
    ogTitle: t("home.ogTitle"),
    ogDescription: t("home.ogDescription"),
    locale,
  });
}

export default function HomePage() {
  return (
    <MarketingShell ticker showLanguageSwitcher>
      <Hero />
      <TrustStrip />
      <InstitutionalRibbon />
      <CryptoCoverageSection />
      <IaSection />
      <BenefitsSection />
      <FeaturesSection />
      <ToolsPreviewSection />
      <DashboardMockSection />
      <CtaSection />
    </MarketingShell>
  );
}
