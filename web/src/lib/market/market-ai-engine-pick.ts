import type { AiChannelId } from "@/lib/assistant/ai-channels";
import type { MarketAiEngineId } from "@/lib/market/market-ai-providers";

const CHANNEL_PREFERENCE: Record<AiChannelId, MarketAiEngineId[]> = {
  research: ["fable", "openai", "gemini", "ollama"],
  docs: ["fable", "gemini", "openai", "ollama"],
  equities: ["fable", "openai", "gemini", "ollama"],
  spreadsheets: ["fable", "openai", "gemini", "ollama"],
  quant: ["fable", "openai", "gemini", "ollama"],
  tutor: ["fable", "gemini", "openai", "ollama"],
};

function keywordAdjustedOrder(
  channel: AiChannelId,
  userLower: string,
): MarketAiEngineId[] {
  const localHints =
    /\b(ollama|local|self[\s-]?host|privacidade|on-?prem|on[\s-]prem)\b/.test(
      userLower,
    );
  if (localHints) return ["ollama", "fable", "openai", "gemini"];

  const longDocHints =
    /\b(relat[oó]rio|10[\s-]?k|20[\s-]?f|annual report|pdf|notas explicativas|footnotes)\b/.test(
      userLower,
    );
  if (longDocHints) return ["fable", "gemini", "openai", "ollama"];

  return CHANNEL_PREFERENCE[channel];
}

/** Ordem de tentativa: primeiro o motor explícito (se válido), depois heurística + restantes. */
export function resolveMarketAiEngineTryOrder(args: {
  available: MarketAiEngineId[];
  channel: AiChannelId;
  lastUserMessage: string;
  explicit?: MarketAiEngineId;
}): MarketAiEngineId[] {
  const { available, channel, lastUserMessage, explicit } = args;
  if (!available.length) return [];

  const ranked = keywordAdjustedOrder(channel, lastUserMessage.toLowerCase());
  const seen = new Set<MarketAiEngineId>();
  const out: MarketAiEngineId[] = [];

  if (explicit && available.includes(explicit)) {
    seen.add(explicit);
    out.push(explicit);
  }

  for (const id of ranked) {
    if (available.includes(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of available) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}
