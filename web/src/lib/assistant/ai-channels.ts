/** Identificadores de canal — combinam com prompts no servidor e chaves AiHub.channels em messages. */

export const AI_CHANNEL_IDS = [
  "research",
  "docs",
  "equities",
  "spreadsheets",
  "quant",
  "tutor",
] as const;

export type AiChannelId = (typeof AI_CHANNEL_IDS)[number];

/** Mesma ordem que `AI_CHANNEL_IDS`, no formato exigido por `z.enum`. */
export const AI_CHANNEL_IDS_ZOD = AI_CHANNEL_IDS as unknown as [
  AiChannelId,
  ...AiChannelId[],
];

/** Deep links externos — termos e contas ficam sob responsabilidade do utilizador. */
export const AI_EXTERNAL_BY_CHANNEL: Partial<Record<AiChannelId, string>> = {
  research: "https://www.perplexity.ai",
  docs: "https://claude.ai",
  equities: "https://www.investing.com",
  spreadsheets: "https://www.microsoft.com/microsoft-365/excel",
  quant: "https://github.com/AI4Finance-Foundation/FinGPT",
};

export const SPREADSHEET_SECONDARY_URL =
  "https://docs.google.com/spreadsheets/";

/** Fallback do tutor para atalhos a assistentes externos comuns (material didático complementar). */
export const TUTOR_QUICK_EXTERNAL = [
  { href: "https://gemini.google.com", brandKey: "gemini" as const },
  { href: "https://chatgpt.com", brandKey: "chatgpt" as const },
  { href: "https://copilot.microsoft.com", brandKey: "copilot" as const },
] as const;

export type AudienceKind = "pf" | "institution";
