/** Locale da UX para prompts e réplicas da mesa PRONUX (alinhado a next-intl). */
export type AiLocale = "pt-BR" | "en";

export function normalizeAiLocale(
  fromBody: unknown,
  acceptLanguage: string | null,
): AiLocale {
  if (fromBody === "pt-BR" || fromBody === "en") return fromBody;
  const al = acceptLanguage?.split(",")[0]?.trim()?.toLowerCase() ?? "";
  if (al.startsWith("en")) return "en";
  if (al.startsWith("pt")) return "pt-BR";
  return "pt-BR";
}
