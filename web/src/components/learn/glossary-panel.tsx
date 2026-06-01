import { ArrowLeft } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  GLOSSARY_TERM_SLUGS,
  type GlossaryTermSlug,
} from "@/lib/seo/learn-catalog";

export async function GlossaryHubPanel() {
  const t = await getTranslations("Learn.glossaryHub");
  const messages = await getMessages();
  const glossary = (messages as { Learn?: { glossary?: Record<string, { term?: string; summary?: string }> } })
    .Learn?.glossary ?? {};

  const terms = GLOSSARY_TERM_SLUGS.map((slug) => ({
    slug,
    term: glossary[slug]?.term ?? slug,
    summary: glossary[slug]?.summary ?? "",
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/aprenda"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToHub")}
      </Link>

      <header className="mt-8 max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t("lead")}</p>
      </header>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {terms.map(({ slug, term, summary }) => (
          <li key={slug}>
            <Link
              href={`/aprenda/glossario/${slug}`}
              className="block rounded-2xl border border-white/10 bg-black/20 px-5 py-4 transition-colors hover:border-primary/25"
            >
              <span className="font-heading text-lg font-semibold">{term}</span>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function GlossaryTermView({ slug }: { slug: GlossaryTermSlug }) {
  const t = await getTranslations("Learn.glossaryHub");
  const tTerm = await getTranslations(`Learn.glossary.${slug}`);
  const messages = await getMessages();
  const glossary = (messages as { Learn?: { glossary?: Record<string, { related?: string[] }> } }).Learn
    ?.glossary ?? {};
  const relatedSlugs = (glossary[slug]?.related ?? []) as string[];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/aprenda/glossario"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToGlossary")}
      </Link>

      <header className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("termEyebrow")}</p>
        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {tTerm("term")}
        </h1>
      </header>

      <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>{tTerm("definition")}</p>
        {tTerm("example") ? <p>{tTerm("example")}</p> : null}
      </div>

      {relatedSlugs.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-heading text-lg font-semibold">{t("relatedTitle")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {relatedSlugs.map((related) => (
              <li key={related}>
                <Link
                  href={`/aprenda/glossario/${related}`}
                  className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-sm transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {(messages as { Learn?: { glossary?: Record<string, { term?: string }> } }).Learn
                    ?.glossary?.[related]?.term ?? related}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </article>
  );
}
