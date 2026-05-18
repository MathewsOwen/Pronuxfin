/** Rotas públicas indexáveis (marketing + auth). */
export const PUBLIC_SITEMAP_PATHS = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/bolsa", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/noticias", priority: 0.8, changeFrequency: "hourly" as const },
  { path: "/projecao", priority: 0.75, changeFrequency: "weekly" as const },
  { path: "/ferramentas", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/ferramentas/juros-compostos", priority: 0.65, changeFrequency: "monthly" as const },
  { path: "/ferramentas/calendario", priority: 0.65, changeFrequency: "daily" as const },
  { path: "/login", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/register", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/privacidade", priority: 0.35, changeFrequency: "yearly" as const },
  { path: "/termos", priority: 0.35, changeFrequency: "yearly" as const },
] as const;

/** Prefixos da mesa privada — nunca indexar. */
export const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/carteira",
  "/calendario",
  "/rota",
  "/alerts",
  "/compare",
  "/perfil",
  "/assistant",
  "/education",
  "/ativo/",
] as const;

/** Caminhos extra para `robots.txt` (auth flows sem valor SEO). Legal fica indexável via sitemap. */
export const ROBOTS_DISALLOW_EXTRA = [
  "/api/",
  "/forgot-password",
  "/reset-password",
  ...PRIVATE_ROUTE_PREFIXES,
] as const;

export function isPrivateAppPath(pathname: string): boolean {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix),
  );
}
