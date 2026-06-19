import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BolsaHubLoader } from "@/components/market/bolsa-hub-loader";
import { BrokerDeskSidebar } from "@/components/market/broker-desk-sidebar";
import { DeskSeoIntro } from "@/components/marketing/desk-seo-intro";
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
    <div className="mx-auto flex w-full max-w-[90rem] items-start gap-6 px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <DeskSeoIntro variant="bolsa" />
        <BolsaHubLoader />
      </div>
      <BrokerDeskSidebar className="hidden w-80 shrink-0 xl:flex" />
    </div>
  );
}
