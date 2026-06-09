import { runFableMarketInfer } from "@/lib/market/market-ai-fable";
import { runGeminiMarketInfer } from "@/lib/market/market-ai-gemini";
import { runMarketInferModel } from "@/lib/market/market-ai-llm";
import { runOpenAiMarketInfer } from "@/lib/market/market-ai-openai";
import type {
  MarketAiEngineId,
  MarketInferProviderId,
} from "@/lib/market/market-ai-providers";

export type UserKeyOverrides = {
  openaiApiKey?: string | null;
  geminiApiKey?: string | null;
};

export async function runMarketEngine(
  engine: MarketAiEngineId,
  options: {
    system: string;
    messages: { role: string; content: string }[];
  },
  keyOverrides?: UserKeyOverrides | null,
): Promise<{ text: string; provider: MarketInferProviderId } | null> {
  switch (engine) {
    case "fable":
      return runFableMarketInfer(options);
    case "ollama":
      return runMarketInferModel(options);
    case "openai":
      return runOpenAiMarketInfer(options, keyOverrides?.openaiApiKey);
    case "gemini":
      return runGeminiMarketInfer(options, keyOverrides?.geminiApiKey);
    default:
      return null;
  }
}
