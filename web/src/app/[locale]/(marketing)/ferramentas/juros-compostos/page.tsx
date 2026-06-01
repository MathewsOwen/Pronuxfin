import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CompoundInterestCalculator } from "@/components/tools/compound-interest-calculator";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

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
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <CompoundInterestCalculator loggedIn={Boolean(user)} />
    </div>
  );
}
