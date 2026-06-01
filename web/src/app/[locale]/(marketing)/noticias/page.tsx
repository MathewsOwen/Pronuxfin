import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NewsHubLoader } from "@/components/market/news-hub-loader";
import type { AppLocale } from "@/i18n/routing";
import {
  isNewsDesk,
  isNewsWorldRegion,
  type NewsDesk,
  type NewsWorldRegion,
} from "@/lib/market/news-feeds-config";
import { marketingMetadata } from "@/lib/page-metadata";

type NoticiasPageProps = {
  searchParams?: Promise<{
    fonte?: string | string[];
    mesa?: string | string[];
    regiao?: string | string[];
  }>;
};

function readSingleParam(raw: string | string[] | undefined): string | null {
  if (typeof raw === "string") return raw.trim() || null;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim() || null;
  return null;
}

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
  const channel = readSingleParam(sp.fonte);
  const rawDesk = readSingleParam(sp.mesa);
  const rawRegion = readSingleParam(sp.regiao);
  const desk: NewsDesk | null = rawDesk && isNewsDesk(rawDesk) ? rawDesk : null;
  const region: NewsWorldRegion | null =
    rawRegion && isNewsWorldRegion(rawRegion) ? rawRegion : null;

  return (
    <NewsHubLoader
      initialDesk={desk}
      initialChannel={channel}
      initialRegion={region}
    />
  );
}
