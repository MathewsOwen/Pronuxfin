import { resolveOllamaOrigin } from "@/lib/market/market-ai-llm";
import { userHasStoredKeyFlags } from "@/lib/user-ai-keys/load";

export const MARKET_AI_ENGINES = ["ollama", "openai", "gemini"] as const;

export type MarketAiEngineId = (typeof MARKET_AI_ENGINES)[number];

export const MARKET_AI_ENGINE_ZOD = MARKET_AI_ENGINES as unknown as [
  MarketAiEngineId,
  ...MarketAiEngineId[],
];

const ENGINE_ORDER: MarketAiEngineId[] = ["ollama", "openai", "gemini"];

/** Motores disponíveis apenas via variáveis de ambiente (chave de plataforma). */
export function listEnginesFromEnv(): MarketAiEngineId[] {
  const out: MarketAiEngineId[] = [];
  if (resolveOllamaOrigin()) out.push("ollama");
  if (process.env.OPENAI_API_KEY?.trim()) out.push("openai");
  if (
    (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY)?.trim()
  )
    out.push("gemini");
  return out;
}

/** União de env + chaves BYOK do utilizador na base (se `DATABASE_URL`). */
export async function listEnginesForUser(
  userId: string | null,
): Promise<MarketAiEngineId[]> {
  const fromEnv = listEnginesFromEnv();
  const merged = new Set<MarketAiEngineId>(fromEnv);

  if (userId) {
    const flags = await userHasStoredKeyFlags(userId);
    if (flags.hasOpenai) merged.add("openai");
    if (flags.hasGemini) merged.add("gemini");
  }

  return ENGINE_ORDER.filter((id) => merged.has(id));
}

export type MarketInferProviderId =
  | "pronux-ollama"
  | "pronux-openai"
  | "pronux-gemini";
