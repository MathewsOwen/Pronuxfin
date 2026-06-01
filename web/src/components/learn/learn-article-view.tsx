import { ArrowLeft, Clock } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArticleJsonLd } from "@/components/seo/article-json-ld";
import { PageFaqJsonLd } from "@/components/seo/page-faq-json-ld";
import { SeoFaqSection } from "@/components/marketing/seo-faq-section";
import { buttonVariants } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/page-metadata";
import {
  LEARN_ARTICLE_META,
  type LearnArticleSlug,
} from "@/lib/seo/learn-catalog";
import { cn } from "@/lib/utils";

type ArticleSection = { heading: string; paragraphs: string[] };

const ARTICLE_FAQ_KEYS = ["what", "how", "risk"] as const;

export async function LearnArticleView({ slug }: { slug: LearnArticleSlug }) {
  const t = await getTranslations("Learn.hub");
  const tArticle = await getTranslations(`Learn.articles.${slug}`);
  const messages = await getMessages();
  const articleBundle = (messages as { Learn?: { articles?: Record<string, unknown> } }).Learn
    ?.articles?.[slug] as
    | { sections?: ArticleSection[]; faq?: Record<string, unknown> }
    | undefined;
  const sections = articleBundle?.sections ?? [];
  const meta = LEARN_ARTICLE_META[slug];
  const pathname = `/aprenda/${slug}`;
  const url = absoluteUrl(pathname);

  return (
    <>
      <ArticleJsonLd
        headline={tArticle("title")}
        description={tArticle("description")}
        url={url}
        datePublished={meta.publishedAt}
        breadcrumbs={[
          { name: t("breadcrumbHome"), url: absoluteUrl("/") },
          { name: t("breadcrumbLearn"), url: absoluteUrl("/aprenda") },
          { name: tArticle("title"), url },
        ]}
      />
      <PageFaqJsonLd
        pathname={pathname}
        namespace={`Learn.articles.${slug}.faq`}
        keys={ARTICLE_FAQ_KEYS}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/aprenda"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToHub")}
        </Link>

        <header className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            {tArticle("eyebrow")}
          </p>
          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {tArticle("title")}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {tArticle("description")}
          </p>
          <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            {t("readingMinutes", { minutes: meta.readingMinutes })}
            <span aria-hidden>·</span>
            <time dateTime={meta.publishedAt}>{meta.publishedAt}</time>
          </p>
        </header>

        <div className="prose-invert mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {meta.relatedTool ? (
          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="font-heading text-lg font-semibold">{tArticle("toolCtaTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {tArticle("toolCtaLead")}
            </p>
            <Link href={meta.relatedTool} className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
              {tArticle("toolCtaButton")}
            </Link>
          </div>
        ) : null}

        <SeoFaqSection
          namespace={`Learn.articles.${slug}.faq`}
          keys={ARTICLE_FAQ_KEYS}
          title={tArticle("faqTitle")}
        />

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
      </article>
    </>
  );
}
