import { defineRouting } from "next-intl/routing";

/** Idiomas ativos — só PT-BR e EN por enquanto (big-tech rollout em fases). */
export const routing = defineRouting({
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

/** Rótulo compacto no seletor (canto superior direito). */
export const LOCALE_SHORT_LABEL: Record<AppLocale, string> = {
  "pt-BR": "PT",
  en: "EN",
};
