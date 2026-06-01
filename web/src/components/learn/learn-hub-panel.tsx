import { BookOpen, GraduationCap } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  GLOSSARY_TERM_SLUGS,
  LEARN_ARTICLE_META,
  LEARN_ARTICLE_SLUGS,
  type GlossaryTermSlug,
  type LearnArticleSlug,
} from "@/lib/seo/learn-catalog";
import { cn } from "@/lib/utils";

type ArticleCard = {
  slug: LearnArticleSlug;
  title: string;
  description: string;
};

type GlossaryPreview = {
  slug: GlossaryTermSlug;
  term: string;
  summary: string;
};

export async function LearnHubPanel() {
  const t = await getTranslations("Learn.hub");
  const messages = await getMessages();
  const learn = (messages as { Learn?: Record<string, unknown> }).Learn ?? {};
  const articlesRaw = (learn.articles as Record<string, { title?: string; description?: string }>) ?? {};
  const glossaryRaw = (learn.glossary as Record<string, { term?: string; summary?: string }>) ?? {};

  const articles: ArticleCard[] = LEARN_ARTICLE_SLUGS.map((slug) => ({
    slug,
    title: articlesRaw[slug]?.title ?? slug,
    description: articlesRaw[slug]?.description ?? "",
  }));

  const glossaryPreview: GlossaryPreview[] = GLOSSARY_TERM_SLUGS.slice(0, 6).map((slug) => ({
    slug,
    term: glossaryRaw[slug]?.term ?? slug,
    summary: glossaryRaw[slug]?.summary ?? "",
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t("lead")}</p>
      </header>

      <section className="mt-12" aria-labelledby="learn-articles-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="learn-articles-heading" className="font-heading text-2xl font-semibold">
            {t("articlesTitle")}
          </h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map(({ slug, title, description }) => {
            const meta = LEARN_ARTICLE_META[slug];
            return (
              <Link
                key={slug}
                href={`/aprenda/${slug}`}
                className="glass-panel card-shine group rounded-3xl border border-white/12 p-6 transition-colors hover:border-primary/30"
              >
                <BookOpen className="size-5 text-primary" aria-hidden />
                <h3 className="font-heading mt-4 text-lg font-semibold group-hover:text-primary">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("readingMinutes", { minutes: meta.readingMinutes })}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-white/10 bg-black/25 p-8 sm:p-10">
        <div className="flex flex-wrap items-start gap-4">
          <GraduationCap className="size-6 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-2xl font-semibold">{t("glossaryTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("glossaryLead")}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {glossaryPreview.map(({ slug, term, summary }) => (
                <li key={slug}>
                  <Link
                    href={`/aprenda/glossario/${slug}`}
                    className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-primary/25"
                  >
                    <span className="font-medium text-foreground">{term}</span>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/aprenda/glossario"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-6")}
            >
              {t("glossaryCta")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold">{t("toolsTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("toolsLead")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/ferramentas/juros-compostos" className={buttonVariants({ size: "sm" })}>
            {t("toolsCompound")}
          </Link>
          <Link
            href="/ferramentas/calendario"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/15")}
          >
            {t("toolsCalendar")}
          </Link>
          <Link
            href="/projecao"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/15")}
          >
            {t("toolsProjecao")}
          </Link>
        </div>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
