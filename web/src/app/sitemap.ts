import type { MetadataRoute } from "next";
import { resolvePublicSiteUrl } from "@/lib/site-url";

const PUBLIC_PATHS = [
  "",
  "/bolsa",
  "/noticias",
  "/projecao",
  "/login",
  "/register",
  "/forgot-password",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolvePublicSiteUrl().replace(/\/$/, "");

  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.75,
  }));
}
