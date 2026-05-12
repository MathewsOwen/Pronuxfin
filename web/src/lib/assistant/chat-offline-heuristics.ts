/**
 * Detects which offline / fallback snippet to show from free-text user messages.
 * Keywords cover multiple locales (PT/EN/ES/FR/IT/ZH-ish) since users may mix languages.
 */

export type OfflineSnippetKey =
  | "chatOfflineMetaEconom"
  | "chatOfflineInvest"
  | "chatOfflineGeneric";

function normalized(userText: string): string {
  return userText
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Goals, budget, economics → meta/econom reply */
const META_ECON_KEYS = [
  "meta",
  "goal",
  "econom",
  "budget",
  "orçamento",
  "orcamento",
  "ahorro",
  "ahorros",
  "épargne",
  "epargne",
  "risparmio",
  "objetivo",
  "objectif",
  "obiettivo",
  "财务",
  "目标",
];

/** Investing / allocation → illustrative portfolio reply */
const INVEST_KEYS = [
  "invest",
  "allocation",
  "portfolio",
  "carteira",
  "portafolio",
  "portafoglio",
  "allocazione",
  "投资",
  "资产配置",
];

export function pickOfflineSnippetKey(userText: string): OfflineSnippetKey {
  const n = normalized(userText);
  if (META_ECON_KEYS.some((k) => n.includes(normalized(k))))
    return "chatOfflineMetaEconom";
  if (INVEST_KEYS.some((k) => n.includes(normalized(k))))
    return "chatOfflineInvest";
  return "chatOfflineGeneric";
}
