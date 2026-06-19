/** Rotas do painel privado — precisam do catálogo i18n completo no cliente. */
export const FULL_I18N_PATH_PREFIXES = [
  "/dashboard",
  "/assistant",
  "/education",
  "/compare",
  "/alerts",
  "/ativo",
  "/carteira",
  "/calendario",
  "/rota",
  "/perfil",
] as const;

/**
 * Namespaces públicos/marketing — evita enviar todo o JSON de traduções no HTML (Ctrl+U / RSC).
 * Inclui auth, bolsa, notícias, aprenda e home.
 */
export const PUBLIC_I18N_NAMESPACES = [
  "Language",
  "SkipLink",
  "NewsFilter",
  "Nav",
  "SiteIntro",
  "Hero",
  "HeroPreview",
  "HeroLive",
  "Trust",
  "CryptoCoverage",
  "Ia",
  "Benefits",
  "Features",
  "ToolsPreview",
  "Tools",
  "MarketStatus",
  "ProductDesk",
  "Cta",
  "Legal",
  "Footer",
  "HomeFaq",
  "AuthLayout",
  "AuthMarketCanvas",
  "Login",
  "Register",
  "Auth",
  "AuthErrors",
  "InstitutionalRibbon",
  "MarketDesk",
  "Seo",
  "DeskSeo",
  "LearnTools",
  "Learn",
  "AboutPage",
  "BolsaHub",
  "ProjecaoHub",
  "NewsHub",
  "NotFound",
  "ForgotPassword",
  "ResetPassword",
  "Maintenance",
  "PlatformDegradation",
] as const;

export function stripLocalePathname(pathname: string, locales: readonly string[]) {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

export function needsFullI18nCatalog(barePath: string): boolean {
  return FULL_I18N_PATH_PREFIXES.some(
    (prefix) => barePath === prefix || barePath.startsWith(`${prefix}/`),
  );
}

export function pickMessageNamespaces<T extends Record<string, unknown>>(
  messages: T,
  namespaces: readonly string[],
): Partial<T> {
  const picked = {} as Partial<T>;
  for (const key of namespaces) {
    if (key in messages) {
      picked[key as keyof T] = messages[key as keyof T];
    }
  }
  return picked;
}
