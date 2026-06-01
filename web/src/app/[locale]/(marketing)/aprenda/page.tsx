import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LearnHubPanel } from "@/components/learn/learn-hub-panel";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.learn");
  return marketingMetadata({
    pathname: "/aprenda",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default function AprendaPage() {
  return <LearnHubPanel />;
}
