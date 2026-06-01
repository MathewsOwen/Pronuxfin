import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { GlossaryTermView } from "@/components/learn/glossary-panel";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import {
  GLOSSARY_TERM_SLUGS,
  isGlossaryTermSlug,
  type GlossaryTermSlug,
} from "@/lib/seo/learn-catalog";

type PageProps = { params: Promise<{ term: string }> };

export function generateStaticParams() {
  return GLOSSARY_TERM_SLUGS.map((term) => ({ term }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term } = await params;
  if (!isGlossaryTermSlug(term)) return {};
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations(`Learn.glossary.${term}`);
  return marketingMetadata({
    pathname: `/aprenda/glossario/${term}`,
    title: t("metaTitle"),
    description: t("metaDescription"),
    ogTitle: `${t("term")} | PRONUXFIN`,
    ogDescription: t("metaDescription"),
    locale,
  });
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { term } = await params;
  if (!isGlossaryTermSlug(term)) notFound();
  return <GlossaryTermView slug={term as GlossaryTermSlug} />;
}
