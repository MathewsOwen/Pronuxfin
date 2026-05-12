import type { MetadataRoute } from "next";

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
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.75,
  }));
}
