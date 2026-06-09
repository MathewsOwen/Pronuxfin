import { fetchLlm } from "@/lib/http/fetch-with-timeout";
import type { MarketInferProviderId } from "@/lib/market/market-ai-providers";

type FableChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

export function resolveFableOrigin(): string | null {
  const raw =
    process.env.PRONUX_FABLE_ORIGIN?.trim() ||
    process.env.FABLE_API_ORIGIN?.trim() ||
    "https://api.fable.ai";
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveFableApiKey(): string | null {
  return (
    process.env.FABLE_API_KEY?.trim() ||
    process.env.PRONUX_FABLE_API_KEY?.trim() ||
    null
  );
}

export async function runFableMarketInfer(
  options: {
    system: string;
    messages: { role: string; content: string }[];
  },
  overrideApiKey?: string | null,
): Promise<{ text: string; provider: MarketInferProviderId } | null> {
  const key = overrideApiKey?.trim() || resolveFableApiKey();
  const origin = resolveFableOrigin();
  if (!key || !origin) return null;

  const model = process.env.PRONUX_FABLE_MODEL?.trim() || "fable-5";
  const temperature = Number(process.env.PRONUX_FABLE_TEMPERATURE ?? 0.3);
  const max_tokens = Number(process.env.PRONUX_FABLE_MAX_TOKENS ?? 1200);
  const tOk = Number.isFinite(temperature) ? temperature : 0.3;
  const maxOk = Number.isFinite(max_tokens) ? Math.min(Math.round(max_tokens), 8192) : 1200;

  const msgs = [
    { role: "system" as const, content: options.system },
    ...options.messages.map((m) => ({
      role:
        m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
  ];

  const res = await fetchLlm(`${origin}/v1/chat/completions`, {
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

  const data = (await res.json()) as FableChatResponse;
  if (!res.ok) {
    throw new Error(
      `pronux_fable_${res.status}: ${(data.error?.message ?? JSON.stringify(data)).slice(0, 420)}`,
    );
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("pronux_fable_empty_reply");
  return { text, provider: "pronux-fable" };
}
