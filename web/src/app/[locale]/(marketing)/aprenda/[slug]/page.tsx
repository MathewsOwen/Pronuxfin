import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LearnArticleView } from "@/components/learn/learn-article-view";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";
import {
  isLearnArticleSlug,
  LEARN_ARTICLE_SLUGS,
  type LearnArticleSlug,
} from "@/lib/seo/learn-catalog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LEARN_ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isLearnArticleSlug(slug)) return {};
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations(`Learn.articles.${slug}`);
  return marketingMetadata({
    pathname: `/aprenda/${slug}`,
    title: t("title"),
    description: t("description"),
    ogTitle: `${t("title")} | PRONUXFIN`,
    ogDescription: t("description"),
    locale,
  });
}

export default async function LearnArticlePage({ params }: PageProps) {
  const { slug } = await params;
  if (!isLearnArticleSlug(slug)) notFound();
  return <LearnArticleView slug={slug as LearnArticleSlug} />;
}
