import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ProjecaoHub } from "@/components/market/projecao-hub";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

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

export default function ProjecaoPage() {
  return (
    <MarketingShell ticker>
      <ProjecaoHub />
    </MarketingShell>
  );
}
