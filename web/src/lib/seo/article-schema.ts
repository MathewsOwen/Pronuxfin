export type ArticleSchemaInput = {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  publisherName?: string;
};

export function buildArticleJsonLd(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    publisher: {
      "@type": "Organization",
      name: input.publisherName ?? "PRONUXFIN",
    },
  };
}

export type BreadcrumbItem = { name: string; url: string };

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
