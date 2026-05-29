import { fetchLlm } from "@/lib/http/fetch-with-timeout";
import type { MarketInferProviderId } from "@/lib/market/market-ai-providers";

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

export async function runOpenAiMarketInfer(
  options: {
    system: string;
    messages: { role: string; content: string }[];
  },
  overrideApiKey?: string | null,
): Promise<{ text: string; provider: MarketInferProviderId } | null> {
  const key = overrideApiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.PRONUX_OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const temperature = Number(process.env.PRONUX_OPENAI_TEMPERATURE ?? 0.35);
  const max_tokens = Number(process.env.PRONUX_OPENAI_MAX_TOKENS ?? 900);
  const tOk = Number.isFinite(temperature) ? temperature : 0.35;
  const maxOk = Number.isFinite(max_tokens) ? Math.min(Math.round(max_tokens), 4096) : 900;

  const msgs = [
    { role: "system" as const, content: options.system },
    ...options.messages.map((m) => ({
      role:
        m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
  ];

  const res = await fetchLlm("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: msgs,
      temperature: tOk,
      max_tokens: maxOk,
    }),
  });

  const data = (await res.json()) as OpenAiChatResponse;
  if (!res.ok) {
    throw new Error(
      `pronux_openai_${res.status}: ${(data.error?.message ?? JSON.stringify(data)).slice(0, 420)}`,
    );
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("pronux_openai_empty_reply");
  return { text, provider: "pronux-openai" };
}
