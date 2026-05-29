import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { HomeBelowFold } from "@/components/marketing/home-below-fold";
import { HomeIntroOverlay } from "@/components/marketing/home-intro-overlay";
import { Hero } from "@/components/marketing/hero";
import { MarketStatusBanner } from "@/components/marketing/market-status-banner";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { HomeFaqJsonLd } from "@/components/seo/home-faq-json-ld";
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
    <>
      <HomeIntroOverlay />
      <MarketingShell ticker showLanguageSwitcher>
        <HomeFaqJsonLd />
        <Hero />
        <MarketStatusBanner />
        <TrustStrip />
        <InstitutionalRibbon />
        <CryptoCoverageSection />
        <HomeBelowFold />
      </MarketingShell>
    </>
  );
}
