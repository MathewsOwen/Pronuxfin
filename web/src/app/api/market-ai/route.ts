import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
import { validateAccessToken } from "@/lib/auth/validate-access-session";
import { isJwtSecretConfigured } from "@/lib/env/server-env";
import { fetchAggregatedNews } from "@/lib/market/fetch-news";
import { AI_CHANNEL_IDS_ZOD, type AiChannelId } from "@/lib/assistant/ai-channels";
import { normalizeAiLocale, type AiLocale } from "@/lib/assistant/market-ai-locale";
import { buildMarketDeskCore } from "@/lib/assistant/market-ai-core-prompt";
import { getSessionUserId } from "@/lib/auth/session-user";
import {
  describeAudienceTone,
  describeChannelFocus,
} from "@/lib/assistant/market-ai-personas";
import { runMarketAiEnsembleParallel } from "@/lib/market/market-ai-ensemble";
import { runMarketEngine } from "@/lib/market/market-ai-dispatch";
import type { MarketAiEngineId } from "@/lib/market/market-ai-providers";
import { resolveMarketAiEngineTryOrder } from "@/lib/market/market-ai-engine-pick";
import {
  listEnginesForUser,
  MARKET_AI_ENGINE_ZOD,
} from "@/lib/market/market-ai-providers";
import { loadQuotesPayload } from "@/lib/market/load-quotes-payload";
import {
  summarizeQuotesForAi,
} from "@/lib/market/market-ai-context";
import { loadDecryptedAiKeys } from "@/lib/user-ai-keys/load";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { consumeRateLimit } from "@/lib/security/distributed-rate-limit";
import { readRequestJson, MAX_MARKET_AI_BODY_BYTES } from "@/lib/http/read-json-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  audience: z.enum(["pf", "institution"]).default("pf"),
  channel: z.enum(AI_CHANNEL_IDS_ZOD).default("tutor"),
  engine: z.enum(MARKET_AI_ENGINE_ZOD).optional(),
  /** Vários motores em paralelo (custo maior) — só com ≥2 motores configurados. */
  ensemble: z.boolean().optional(),
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
    rate429: string;
    noEngine503: string;
    model503: string;
  }
> = {
  "pt-BR": {
    jwt503:
      "Servidor não autentica usuários neste momento (JWT_SECRET ausente).",
    session401: "Sessão necessária. Entre novamente.",
    body400:
      "Formato inválido: envie JSON com messages[], opcionalmente audience, channel, engine e locale.",
    json400: "JSON inválido no corpo.",
    rate429: "Muitos pedidos à IA de mercado. Aguarde um minuto e tente de novo.",
    noEngine503:
      "Nenhum motor de IA está configurado. Defina FABLE_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY ou Ollama no servidor, ou guarde chaves BYOK no perfil.",
    model503:
      "Os motores de IA configurados não responderam. Tente outro motor ou verifique chaves e quotas.",
  },
  en: {
    jwt503: "Cannot authenticate users — JWT_SECRET is missing on this server.",
    session401: "Active session required. Please sign in again.",
    body400:
      "Invalid payload: JSON must include messages[], optional audience, channel, engine, locale.",
    json400: "Invalid JSON payload.",
    rate429: "Too many market AI requests. Wait a minute and try again.",
    noEngine503:
      "No AI engine is configured. Set FABLE_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or Ollama on the server, or save BYOK keys in your profile.",
    model503:
      "Configured AI engines did not respond. Try another engine or check keys and quotas.",
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
  if (!isJwtSecretConfigured()) {
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
  const token = readAuthCookieValue(jar);
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

  const session = await validateAccessToken(token);
  if (!session) {
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
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const al = req.headers.get("accept-language");

  const parsedJson = await readRequestJson(req, {
    maxBytes: MAX_MARKET_AI_BODY_BYTES,
  });
  if (!parsedJson.ok) {
    const loc = normalizeAiLocale(undefined, al);
    return NextResponse.json(
      {
        ok: false as const,
        code:
          parsedJson.response.status === 413
            ? "MARKET_AI_BODY_TOO_LARGE"
            : "MARKET_AI_JSON_INVALID",
        message:
          parsedJson.response.status === 413
            ? "Request body too large."
            : HTTP_MSG[loc].json400,
      },
      { status: parsedJson.response.status },
    );
  }

  const rawUnknown = parsedJson.value;

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
  if (userId) {
    const limited = await consumeRateLimit(
      `market-ai:user:${userId}`,
      12,
      60_000,
      { failClosed: true },
    );
    if (!limited.ok) {
      return NextResponse.json(
        {
          ok: false as const,
          code: "MARKET_AI_RATE_LIMITED",
          message: HTTP_MSG[locale].rate429,
        },
        { status: 429 },
      );
    }
  }
  const configured = await listEnginesForUser(userId);
  if (configured.length === 0) {
    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_NO_ENGINE",
        message: HTTP_MSG[locale].noEngine503,
      },
      { status: 503 },
    );
  }

  const lastUser =
    [...clipped].reverse().find((m) => m.role === "user")?.content ?? "";
  const tryOrder = resolveMarketAiEngineTryOrder({
    available: configured,
    channel: parsed.channel,
    lastUserMessage: lastUser,
    explicit: parsed.engine,
  });

  const keyMaterial = userId ? await loadDecryptedAiKeys(userId) : null;
  const keyOverrides = keyMaterial
    ? {
        openaiApiKey: keyMaterial.openaiKey,
        geminiApiKey: keyMaterial.geminiKey,
      }
    : null;

  const ensembleAllowed = process.env.MARKET_AI_ENSEMBLE_DISABLED?.trim() !== "1";
  const ensembleRequested =
    Boolean(parsed.ensemble) &&
    ensembleAllowed &&
    !parsed.engine &&
    configured.length >= 2;
  const ensembleMaxEngines = Math.min(
    5,
    Math.max(2, Number.parseInt(process.env.MARKET_AI_ENSEMBLE_MAX_ENGINES ?? "3", 10) || 3),
  );
  const enginesStableOrder = (["fable", "openai", "gemini", "ollama"] as const).filter(
    (id): id is MarketAiEngineId => configured.includes(id),
  );

  try {
    if (ensembleRequested) {
      const panel = await runMarketAiEnsembleParallel({
        engines: enginesStableOrder,
        maxEngines: ensembleMaxEngines,
        locale,
        system: systemPrompt,
        messages: apiMessages,
        keyOverrides,
      });
      if (panel) {
        return NextResponse.json({
          ok: true as const,
          reply: panel.reply,
          ensemble: true as const,
          segments: panel.segments.map((s) => ({
            engine: s.engine,
            provider: s.provider,
          })),
        });
      }
    }

    for (const engineId of tryOrder) {
      const out = await runMarketEngine(
        engineId,
        {
          system: systemPrompt,
          messages: apiMessages,
        },
        keyOverrides,
      );
      if (out) {
        return NextResponse.json({
          ok: true as const,
          reply: out.text,
          provider: out.provider,
          engine: engineId,
        });
      }
    }

    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_MODEL_UNAVAILABLE",
        message: HTTP_MSG[locale].model503,
      },
      { status: 503 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        code: "MARKET_AI_MODEL_UNAVAILABLE",
        message: HTTP_MSG[locale].model503,
      },
      { status: 503 },
    );
  }
}
