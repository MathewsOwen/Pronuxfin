import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE } from "@/lib/constants";
import { fetchAggregatedNews } from "@/lib/market/fetch-news";
import { AI_CHANNEL_IDS_ZOD, type AiChannelId } from "@/lib/assistant/ai-channels";
import { normalizeAiLocale, type AiLocale } from "@/lib/assistant/market-ai-locale";
import { buildMarketDeskCore } from "@/lib/assistant/market-ai-core-prompt";
import { getSessionUserId } from "@/lib/auth/session-user";
import {
  describeAudienceTone,
  describeChannelFocus,
} from "@/lib/assistant/market-ai-personas";
import { runMarketEngine } from "@/lib/market/market-ai-dispatch";
import type { MarketAiEngineId } from "@/lib/market/market-ai-providers";
import {
  listEnginesForUser,
  MARKET_AI_ENGINE_ZOD,
} from "@/lib/market/market-ai-providers";
import { loadQuotesPayload } from "@/lib/market/load-quotes-payload";
import {
  demoMarketReply,
  remoteModelFailureSuffix,
  summarizeQuotesForAi,
} from "@/lib/market/market-ai-context";
import { loadDecryptedAiKeys } from "@/lib/user-ai-keys/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  audience: z.enum(["pf", "institution"]).default("pf"),
  channel: z.enum(AI_CHANNEL_IDS_ZOD).default("tutor"),
  engine: z.enum(MARKET_AI_ENGINE_ZOD).optional(),
  locale: z.enum(["pt-BR", "en"]).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(28),
});

const HTTP_MSG: Record<
  AiLocale,
  {
    jwt503: string;
    session401: string;
    body400: string;
    json400: string;
  }
> = {
  "pt-BR": {
    jwt503:
      "Servidor não autentica usuários neste momento (JWT_SECRET ausente).",
    session401: "Sessão necessária. Entre novamente.",
    body400:
      "Formato inválido: envie JSON com messages[], opcionalmente audience, channel, engine e locale.",
    json400: "JSON inválido no corpo.",
  },
  en: {
    jwt503: "Cannot authenticate users — JWT_SECRET is missing on this server.",
    session401: "Active session required. Please sign in again.",
    body400:
      "Invalid payload: JSON must include messages[], optional audience, channel, engine, locale.",
    json400: "Invalid JSON payload.",
  },
};

async function buildHeadlinesForChannel(channel: AiChannelId): Promise<string[]> {
  let slice = 7;
  if (channel === "research") slice = 14;
  else if (channel === "equities") slice = 12;

  try {
    const articles = await fetchAggregatedNews(72);
    return articles.slice(0, slice).map((a) => `• ${a.source}: ${a.title}`);
  } catch {
    return [];
  }
}

async function assertSession(
  locale: AiLocale,
): Promise<NextResponse | null> {
  const msgs = HTTP_MSG[locale];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_JWT_UNAVAILABLE",
        message: msgs.jwt503,
      },
      { status: 503 },
    );
  }

  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_SESSION_REQUIRED",
        message: msgs.session401,
      },
      { status: 401 },
    );
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_SESSION_REQUIRED",
        message: msgs.session401,
      },
      { status: 401 },
    );
  }

  return null;
}

export async function GET(req: Request) {
  const al = req.headers.get("accept-language");
  const locale = normalizeAiLocale(undefined, al);
  const gate = await assertSession(locale);
  if (gate) return gate;
  const userId = await getSessionUserId();
  const engines = await listEnginesForUser(userId);
  return NextResponse.json({
    ok: true as const,
    engines,
  });
}

export async function POST(req: Request) {
  const al = req.headers.get("accept-language");

  let rawUnknown: unknown;
  try {
    rawUnknown = await req.json();
  } catch {
    const loc = normalizeAiLocale(undefined, al);
    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_JSON_INVALID",
        message: HTTP_MSG[loc].json400,
      },
      { status: 400 },
    );
  }

  const localeGuess = normalizeAiLocale(
    typeof rawUnknown === "object" &&
      rawUnknown !== null &&
      "locale" in (rawUnknown as object)
      ? (rawUnknown as { locale?: unknown }).locale
      : undefined,
    al,
  );

  const gateEarly = await assertSession(localeGuess);
  if (gateEarly) return gateEarly;

  const r = bodySchema.safeParse(rawUnknown);
  if (!r.success) {
    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_BODY_INVALID",
        message: HTTP_MSG[localeGuess].body400,
      },
      { status: 400 },
    );
  }

  const parsed = r.data;
  const locale = normalizeAiLocale(parsed.locale, al);

  const clipped = parsed.messages.slice(-24).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 6000),
  }));

  const [quotesResult, headlineHints] = await Promise.all([
    loadQuotesPayload(),
    buildHeadlinesForChannel(parsed.channel),
  ]);
  const { payload } = quotesResult;

  const marketBlock = summarizeQuotesForAi(payload, headlineHints, locale);

  const systemPrompt = [
    buildMarketDeskCore(locale),
    describeAudienceTone(parsed.audience, locale),
    describeChannelFocus(parsed.channel, locale),
    `--- SNAPSHOT OPERACIONAL (PRONUX) ---\n${marketBlock}`,
  ].join("\n\n");

  const apiMessages = clipped.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const userId = await getSessionUserId();
  const configured = await listEnginesForUser(userId);
  const chosen: MarketAiEngineId | null =
    parsed.engine && configured.includes(parsed.engine)
      ? parsed.engine
      : (configured[0] ?? null);

  const keyMaterial = userId ? await loadDecryptedAiKeys(userId) : null;
  const keyOverrides = keyMaterial
    ? {
        openaiApiKey: keyMaterial.openaiKey,
        geminiApiKey: keyMaterial.geminiKey,
      }
    : null;

  try {
    if (chosen) {
      const out = await runMarketEngine(
        chosen,
        {
          system: systemPrompt,
          messages: apiMessages,
        },
        keyOverrides,
      );
      if (out) {
        return NextResponse.json({
          ok: true as const,
          demo: false as const,
          reply: out.text,
          provider: out.provider,
        });
      }
    }

    const lastUser =
      [...clipped].reverse().find((m) => m.role === "user")?.content ?? "";
    const reply = demoMarketReply(lastUser, marketBlock, locale);
    return NextResponse.json({ ok: true as const, demo: true as const, reply });
  } catch {
    const lastUser =
      [...clipped].reverse().find((m) => m.role === "user")?.content ?? "";
    const reply = `${demoMarketReply(lastUser, marketBlock, locale)}\n\n(${remoteModelFailureSuffix(locale)})`;

    return NextResponse.json({
      ok: true as const,
      demo: true as const,
      reply,
    });
  }
}
