import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth/auth-cookie-names", () => ({
  readAuthCookieValue: vi.fn(),
}));

vi.mock("@/lib/auth/validate-access-session", () => ({
  validateAccessToken: vi.fn(),
}));

vi.mock("@/lib/auth/session-user", () => ({
  getSessionUserId: vi.fn(),
}));

vi.mock("@/lib/market/load-quotes-payload", () => ({
  loadQuotesPayload: vi.fn(),
}));

vi.mock("@/lib/market/fetch-news", () => ({
  fetchAggregatedNews: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/market/market-ai-providers", () => ({
  listEnginesForUser: vi.fn(),
  MARKET_AI_ENGINE_ZOD: ["ollama", "openai", "gemini"],
}));

vi.mock("@/lib/security/mutation-guard", () => ({
  assertMutationAllowed: vi.fn(() => null),
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ ok: true, retryAfterSec: 60 }),
}));

vi.mock("@/lib/user-ai-keys/load", () => ({
  loadDecryptedAiKeys: vi.fn().mockResolvedValue(null),
}));

import { cookies } from "next/headers";
import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
import { validateAccessToken } from "@/lib/auth/validate-access-session";
import { getSessionUserId } from "@/lib/auth/session-user";
import { loadQuotesPayload } from "@/lib/market/load-quotes-payload";
import { listEnginesForUser } from "@/lib/market/market-ai-providers";
import { consumeRateLimit } from "@/lib/security/distributed-rate-limit";
import { GET, POST } from "@/app/api/market-ai/route";

const mockCookies = vi.mocked(cookies);
const mockReadToken = vi.mocked(readAuthCookieValue);
const mockValidate = vi.mocked(validateAccessToken);
const mockUserId = vi.mocked(getSessionUserId);
const mockQuotes = vi.mocked(loadQuotesPayload);
const mockEngines = vi.mocked(listEnginesForUser);
const mockRateLimit = vi.mocked(consumeRateLimit);

const quotesPayload = {
  payload: {
    fetchedAt: Date.now(),
    br: [],
    crypto: [],
    warnings: [],
  },
  warnings: [],
};

describe("/api/market-ai", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
    mockCookies.mockResolvedValue({} as never);
    mockReadToken.mockReturnValue("access-token");
    mockValidate.mockResolvedValue({ userId: "user-1", tokenVersion: 0 });
    mockUserId.mockResolvedValue("user-1");
    mockQuotes.mockResolvedValue(quotesPayload as never);
    mockEngines.mockResolvedValue([]);
    mockRateLimit.mockResolvedValue({ ok: true, retryAfterSec: 60 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("GET returns 401 without session", async () => {
    mockReadToken.mockReturnValue(undefined);
    const res = await GET(new Request("http://localhost/api/market-ai"));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("MARKET_AI_SESSION_REQUIRED");
  });

  it("GET lists engines for authenticated user", async () => {
    mockEngines.mockResolvedValue(["openai", "gemini"]);
    const res = await GET(new Request("http://localhost/api/market-ai"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.engines).toEqual(["openai", "gemini"]);
  });

  it("POST returns 503 when no LLM engines are configured", async () => {
    const res = await POST(
      new Request("http://localhost/api/market-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Como está a bolsa hoje?" }],
          channel: "tutor",
          locale: "pt-BR",
        }),
      }),
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.code).toBe("MARKET_AI_NO_ENGINE");
  });

  it("POST rejects invalid JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/market-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("MARKET_AI_BODY_INVALID");
  });
});
