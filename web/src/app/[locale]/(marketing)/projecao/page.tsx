import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProjecaoHubLoader } from "@/components/market/projecao-hub-loader";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

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
  return <ProjecaoHubLoader loggedIn={Boolean(user)} />;
}
