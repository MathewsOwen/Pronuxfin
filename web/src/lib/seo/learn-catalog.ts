/** Catálogo indexável da mesa pública /aprenda — slugs estáveis para sitemap e rotas. */

export const LEARN_ARTICLE_SLUGS = [
  "juros-compostos-guia",
  "cdi-selic-ipca",
  "copom-e-investimentos",
] as const;

export type LearnArticleSlug = (typeof LEARN_ARTICLE_SLUGS)[number];

export const GLOSSARY_TERM_SLUGS = [
  "cdi",
  "selic",
  "ipca",
  "ticker",
  "dividend-yield",
  "pe-ratio",
  "copom",
  "tesouro-selic",
  "poupanca",
  "renda-fixa",
  "renda-variavel",
  "aporte",
] as const;

export type GlossaryTermSlug = (typeof GLOSSARY_TERM_SLUGS)[number];

export function isLearnArticleSlug(value: string): value is LearnArticleSlug {
  return (LEARN_ARTICLE_SLUGS as readonly string[]).includes(value);
}

export function isGlossaryTermSlug(value: string): value is GlossaryTermSlug {
  return (GLOSSARY_TERM_SLUGS as readonly string[]).includes(value);
}

/** Metadados editoriais estáveis (datas ISO) — corpo traduzido em messages. */
export const LEARN_ARTICLE_META: Record<
  LearnArticleSlug,
  { publishedAt: string; readingMinutes: number; relatedTool?: string }
> = {
  "juros-compostos-guia": {
    publishedAt: "2026-06-01",
    readingMinutes: 6,
    relatedTool: "/ferramentas/juros-compostos",
  },
  "cdi-selic-ipca": {
    publishedAt: "2026-06-01",
    readingMinutes: 7,
    relatedTool: "/ferramentas/juros-compostos",
  },
  "copom-e-investimentos": {
    publishedAt: "2026-06-01",
    readingMinutes: 5,
    relatedTool: "/ferramentas/calendario",
  },
};

/** Caminhos extras para sitemap (além de PUBLIC_SITEMAP_PATHS). */
export function getLearnSitemapPaths(): Array<{
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
}> {
  return [
    { path: "/aprenda", priority: 0.85, changeFrequency: "weekly" },
    { path: "/aprenda/glossario", priority: 0.8, changeFrequency: "monthly" },
    ...LEARN_ARTICLE_SLUGS.map((slug) => ({
      path: `/aprenda/${slug}`,
      priority: 0.72,
      changeFrequency: "monthly" as const,
    })),
    ...GLOSSARY_TERM_SLUGS.map((slug) => ({
      path: `/aprenda/glossario/${slug}`,
      priority: 0.58,
      changeFrequency: "yearly" as const,
    })),
  ];
}
