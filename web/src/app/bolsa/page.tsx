import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { BolsaLiveHub } from "@/components/market/bolsa-live-hub";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.bolsa");
  return marketingMetadata({
    pathname: "/bolsa",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default function BolsaPage() {
  return (
    <MarketingShell ticker>
      <BolsaLiveHub />
    </MarketingShell>
  );
}
