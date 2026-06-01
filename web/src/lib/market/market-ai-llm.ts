/**
 * Inferência PRONUX via protocolo nativo do Ollama (/api/chat) — não usa o formato
 * chat/completions nem serviços centrados na OpenAI.
 */

import { fetchLlm } from "@/lib/http/fetch-with-timeout";
import { isProductionRuntime } from "@/lib/env/server-env";
import { isSafeHttpUrl } from "@/lib/http/ssrf-guard";

export type MarketAiInferProvider = "pronux-ollama";

/** Resposta JSON do Ollama com stream:false (campos omitidos são ignorados). */
type OllamaChatResponse = {
  message?: { role?: string; content?: string | null };
};

function normalizeOllamaOrigin(raw: string): string {
  let t = raw.trim().replace(/\/+$/, "");
  if (t.endsWith("/v1")) {
    t = t.slice(0, -3);
    t = t.replace(/\/+$/, "");
  }
  return t || raw.trim();
}

/**
 * Preferência PRONUX_MARKET_AI_OLLAMA_ORIGIN (ex.: http://127.0.0.1:11434).
 * PRONUX_MARKET_AI_BASE_URL ainda aceito por compatibilidade: se terminava em …/v1,
 * tratamos como host Ollama.
 */
export function resolveOllamaOrigin(): string | null {
  const preferred = process.env.PRONUX_MARKET_AI_OLLAMA_ORIGIN?.trim();
  if (preferred) {
    const n = normalizeOllamaOrigin(preferred);
    return n.length > 0 && validateOllamaOrigin(n) ? n : null;
  }
  const legacy = process.env.PRONUX_MARKET_AI_BASE_URL?.trim();
  if (!legacy) return null;
  const n = normalizeOllamaOrigin(legacy);
  return n.length > 0 && validateOllamaOrigin(n) ? n : null;
}

function validateOllamaOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;

    if (isProductionRuntime()) {
      return isSafeHttpUrl(origin);
    }

    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return true;
    }
    return isSafeHttpUrl(origin);
  } catch {
    return false;
  }
}

export async function runMarketInferModel(options: {
  system: string;
  messages: { role: string; content: string }[];
}): Promise<{ text: string; provider: MarketAiInferProvider } | null> {
  const origin = resolveOllamaOrigin();
  if (!origin) return null;

  const model = process.env.PRONUX_MARKET_AI_MODEL?.trim() || "llama3.2";

  const temperature = Number(process.env.PRONUX_MARKET_AI_TEMPERATURE ?? 0.35);
  const numPredict = Number(process.env.PRONUX_MARKET_AI_MAX_TOKENS ?? 900);
  const tOk = Number.isFinite(temperature) ? temperature : 0.35;
  const npOk = Number.isFinite(numPredict)
    ? Math.min(Math.round(numPredict), 4096)
    : 900;

  const ollamaMessages = [
    { role: "system" as const, content: options.system },
    ...options.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const url = `${origin.replace(/\/+$/, "")}/api/chat`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.PRONUX_MARKET_AI_OLLAMA_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchLlm(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature: tOk,
        num_predict: npOk,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`pronux_ollama_${res.status}: ${errText.slice(0, 420)}`);
  }

  const data = (await res.json()) as OllamaChatResponse;
  const text = data.message?.content?.trim();
  if (!text) throw new Error("pronux_ollama_empty_reply");

  return { text, provider: "pronux-ollama" };
}
