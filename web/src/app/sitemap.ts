import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-routes";
import { getLearnSitemapPaths } from "@/lib/seo/learn-catalog";
import { resolvePublicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolvePublicSiteUrl().replace(/\/$/, "");
  const now = new Date();

  const entries = [...PUBLIC_SITEMAP_PATHS, ...getLearnSitemapPaths()];

  return entries.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
