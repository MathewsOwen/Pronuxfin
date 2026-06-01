import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AboutPage } from "@/components/marketing/about-page";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.about");
  return marketingMetadata({
    pathname: "/sobre",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default function SobrePage() {
  return <AboutPage />;
}
