import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthenticatedPublicChrome } from "@/components/layout/authenticated-public-chrome";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ToolsHubPanel } from "@/components/tools/tools-hub-panel";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.tools");
  return marketingMetadata({
    pathname: "/ferramentas",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default async function FerramentasPage() {
  const user = await getCurrentUser();
  const panel = <ToolsHubPanel loggedIn={Boolean(user)} />;

  if (user) {
    return <AuthenticatedPublicChrome user={user}>{panel}</AuthenticatedPublicChrome>;
  }

  return <MarketingShell ticker>{panel}</MarketingShell>;
}
