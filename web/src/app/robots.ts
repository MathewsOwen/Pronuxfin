import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_EXTRA } from "@/lib/seo/public-routes";
import { resolvePublicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = resolvePublicSiteUrl().replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_EXTRA],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
