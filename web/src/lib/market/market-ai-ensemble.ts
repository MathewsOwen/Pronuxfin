import type { AiLocale } from "@/lib/assistant/market-ai-locale";
import type { UserKeyOverrides } from "@/lib/market/market-ai-dispatch";
import { runMarketEngine } from "@/lib/market/market-ai-dispatch";
import type {
  MarketAiEngineId,
  MarketInferProviderId,
} from "@/lib/market/market-ai-providers";

const ENGINE_LABEL: Record<AiLocale, Record<MarketAiEngineId, string>> = {
  "pt-BR": {
    openai: "OpenAI",
    gemini: "Google Gemini",
    ollama: "Ollama (local)",
  },
  en: {
    openai: "OpenAI",
    gemini: "Google Gemini",
    ollama: "Ollama (local)",
  },
};

function ensembleIntro(locale: AiLocale): string {
  return locale === "pt-BR"
    ? "Painel multi-IA: cada bloco abaixo veio de um motor diferente; cruze as leituras e valide antes de decidir.\n\n"
    : "Multi-AI panel: each block below is from a different engine; reconcile readings before you act.\n\n";
}

/** Vários motores em paralelo — maior custo/latência; resposta única com secções etiquetadas. */
export async function runMarketAiEnsembleParallel(args: {
  engines: MarketAiEngineId[];
  maxEngines: number;
  locale: AiLocale;
  system: string;
  messages: { role: string; content: string }[];
  keyOverrides: UserKeyOverrides | null;
}): Promise<{
  reply: string;
  segments: Array<{ engine: MarketAiEngineId; provider: MarketInferProviderId; text: string }>;
} | null> {
  const slice = args.engines.slice(
    0,
    Math.min(args.engines.length, Math.max(2, args.maxEngines)),
  );
  if (slice.length < 2) return null;

  const settled = await Promise.all(
    slice.map(async (engine) => {
      const out = await runMarketEngine(
        engine,
        { system: args.system, messages: args.messages },
        args.keyOverrides,
      );
      return { engine, out };
    }),
  );

  const segments = settled
    .filter(
      (row): row is typeof row & { out: NonNullable<(typeof row)["out"]> } =>
        row.out != null && row.out.text.trim().length > 0,
    )
    .map((row) => ({
      engine: row.engine,
      provider: row.out.provider,
      text: row.out.text.trim(),
    }));

  if (segments.length < 2) return null;

  const body = segments
    .map(
      (s) =>
        `— ${ENGINE_LABEL[args.locale][s.engine]} —\n${s.text}`,
    )
    .join("\n\n");

  return {
    reply: `${ensembleIntro(args.locale)}${body}`,
    segments,
  };
}
