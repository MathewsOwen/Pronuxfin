import { fetchLlm } from "@/lib/http/fetch-with-timeout";
import type { MarketInferProviderId } from "@/lib/market/market-ai-providers";

type GeminiPart = { text: string };
type GeminiContent = { role: string; parts: GeminiPart[] };

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

function toGeminiContents(
  messages: { role: string; content: string }[],
): GeminiContent[] {
  const out: GeminiContent[] = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    const text = m.content.trim();
    if (!text) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) {
      last.parts[0]!.text += `\n\n${text}`;
    } else {
      out.push({ role, parts: [{ text }] });
    }
  }

  /** Gemini espera primeira mensagem como `user`; boas-vindas do assistente vêm antes. */
  if (out.length > 0 && out[0]!.role === "model") {
    out.unshift({
      role: "user",
      parts: [{ text: "(Início de sessão PRONUX — contexto do canal já está na instrução de sistema.)" }],
    });
  }

  return out;
}

export async function runGeminiMarketInfer(
  options: {
    system: string;
    messages: { role: string; content: string }[];
  },
  overrideApiKey?: string | null,
): Promise<{ text: string; provider: MarketInferProviderId } | null> {
  const key =
    overrideApiKey?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const model =
    process.env.PRONUX_GEMINI_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-2.0-flash";

  const temperature = Number(process.env.PRONUX_GEMINI_TEMPERATURE ?? 0.35);
  const maxOutputTokens = Number(process.env.PRONUX_GEMINI_MAX_TOKENS ?? 900);
  const tOk = Number.isFinite(temperature) ? temperature : 0.35;
  const maxOk = Number.isFinite(maxOutputTokens)
    ? Math.min(Math.round(maxOutputTokens), 8192)
    : 900;

  const contents = toGeminiContents(options.messages);
  if (contents.length === 0) {
    throw new Error("pronux_gemini_no_user_content");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetchLlm(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.system }] },
      contents,
      generationConfig: {
        temperature: tOk,
        maxOutputTokens: maxOk,
      },
    }),
  });

  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    throw new Error(
      `pronux_gemini_${res.status}: ${(data.error?.message ?? JSON.stringify(data)).slice(0, 420)}`,
    );
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("pronux_gemini_empty_reply");
  return { text, provider: "pronux-gemini" };
}
