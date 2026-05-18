import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { AuthenticatedPublicChrome } from "@/components/layout/authenticated-public-chrome";
import { NewsLiveHub } from "@/components/market/news-live-hub";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

type NoticiasPageProps = {
  searchParams?: Promise<{ fonte?: string | string[] }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.noticias");
  return marketingMetadata({
    pathname: "/noticias",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
    locale,
  });
}

export default async function NoticiasPage({ searchParams }: NoticiasPageProps) {
  const sp = searchParams ? await searchParams : {};
  const raw = sp.fonte;
  let channel: string | null = null;
  if (typeof raw === "string") channel = raw.trim() || null;
  else if (Array.isArray(raw) && typeof raw[0] === "string") channel = raw[0].trim() || null;

  const user = await getCurrentUser();
  const hub = <NewsLiveHub channelFilter={channel} />;

  if (user) {
    return <AuthenticatedPublicChrome user={user}>{hub}</AuthenticatedPublicChrome>;
  }

  return (
    <MarketingShell ticker>
      {hub}
    </MarketingShell>
  );
}
