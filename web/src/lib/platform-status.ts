import { configDegradationReason, readTrimmedEnv } from "@/lib/env/server-env";

type PlatformStatus = {
  degraded: boolean;
  reason?: string;
  checkedAt: string;
};

const CHECK_TIMEOUT_MS = 3_500;
const CACHE_TTL_MS = 45_000;
const MAX_BACKEND_ATTEMPTS = 2;

let cache: { value: PlatformStatus; expiresAt: number } | null = null;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function checkBackendReadyOnce(apiUrl: string): Promise<boolean> {
  const res = await withTimeout(
    fetch(`${apiUrl.replace(/\/+$/, "")}/health/ready`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
    CHECK_TIMEOUT_MS,
  );
  return res.ok;
}

async function checkBackendReadyWithRetry(apiUrl: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  for (let attempt = 1; attempt <= MAX_BACKEND_ATTEMPTS; attempt++) {
    try {
      const ok = await checkBackendReadyOnce(apiUrl);
      if (ok) return { ok: true };
      if (attempt < MAX_BACKEND_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      return {
        ok: false,
        reason: "API principal indisponível ou em inicialização.",
      };
    } catch {
      if (attempt < MAX_BACKEND_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      return {
        ok: false,
        reason: "Falha de conectividade com a API principal.",
      };
    }
  }
  return { ok: false, reason: "Falha de conectividade com a API principal." };
}

/** Limpa cache (testes ou após recuperação manual). */
export function invalidatePlatformStatusCache(): void {
  cache = null;
}

export async function getPlatformStatus(): Promise<PlatformStatus> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  const configReason = configDegradationReason();
  if (configReason) {
    const value = {
      degraded: true,
      reason: configReason,
      checkedAt: new Date().toISOString(),
    };
    cache = { value, expiresAt: now + CACHE_TTL_MS };
    return value;
  }

  const apiUrl = readTrimmedEnv("API_URL");
  if (!apiUrl) {
    const value = {
      degraded: true,
      reason: "API_URL não configurada no frontend.",
      checkedAt: new Date().toISOString(),
    };
    cache = { value, expiresAt: now + CACHE_TTL_MS };
    return value;
  }

  const backend = await checkBackendReadyWithRetry(apiUrl);
  const value = {
    degraded: !backend.ok,
    reason: backend.reason,
    checkedAt: new Date().toISOString(),
  };
  cache = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}
