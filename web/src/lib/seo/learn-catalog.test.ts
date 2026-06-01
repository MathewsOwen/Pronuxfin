import { describe, expect, it } from "vitest";

import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "./article-schema";
import { getLearnSitemapPaths, LEARN_ARTICLE_SLUGS } from "./learn-catalog";

describe("learn-catalog", () => {
  it("lists article slugs in sitemap paths", () => {
    const paths = getLearnSitemapPaths().map((e) => e.path);
    expect(paths).toContain("/aprenda");
    expect(paths).toContain(`/aprenda/${LEARN_ARTICLE_SLUGS[0]}`);
  });
});

describe("article-schema", () => {
  it("builds Article json-ld", () => {
    const json = buildArticleJsonLd({
      headline: "Test",
      description: "Desc",
      url: "https://example.com/aprenda/test",
      datePublished: "2026-06-01",
    });
    expect(json["@type"]).toBe("Article");
    expect(json.headline).toBe("Test");
  });

  it("builds BreadcrumbList", () => {
    const json = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://example.com/" },
      { name: "Learn", url: "https://example.com/aprenda" },
    ]);
    expect(json.itemListElement).toHaveLength(2);
  });
});
