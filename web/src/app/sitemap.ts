import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-routes";
import { resolvePublicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolvePublicSiteUrl().replace(/\/$/, "");
  const now = new Date();

  return PUBLIC_SITEMAP_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
