import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthenticatedPublicChrome } from "@/components/layout/authenticated-public-chrome";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { BolsaLiveHub } from "@/components/market/bolsa-live-hub";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

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

export default async function BolsaPage() {
  const user = await getCurrentUser();
  const hub = <BolsaLiveHub />;

  if (user) {
    return <AuthenticatedPublicChrome user={user}>{hub}</AuthenticatedPublicChrome>;
  }

  return (
    <MarketingShell ticker>
      {hub}
    </MarketingShell>
  );
}
