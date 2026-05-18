type PlatformStatus = {
  degraded: boolean;
  reason?: string;
  checkedAt: string;
};

const CHECK_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 60_000;

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

async function checkEndpoint(url: string) {
  const res = await withTimeout(
    fetch(url, { cache: "no-store", headers: { Accept: "application/json" } }),
    CHECK_TIMEOUT_MS,
  );
  return res.ok;
}

export async function getPlatformStatus(): Promise<PlatformStatus> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  const apiUrl = process.env.API_URL?.trim() ?? "";
  if (!apiUrl) {
    const value = {
      degraded: true,
      reason: "API_URL não configurada no frontend.",
      checkedAt: new Date().toISOString(),
    };
    cache = { value, expiresAt: now + CACHE_TTL_MS };
    return value;
  }

  const backendReadyUrl = `${apiUrl.replace(/\/+$/, "")}/health/ready`;
  let degraded = false;
  let reason: string | undefined;

  try {
    const backendReady = await checkEndpoint(backendReadyUrl);
    if (!backendReady) {
      degraded = true;
      reason = "API principal indisponível ou em inicialização.";
    }
  } catch {
    degraded = true;
    reason = "Falha de conectividade com a API principal.";
  }

  const value = {
    degraded,
    reason,
    checkedAt: new Date().toISOString(),
  };
  cache = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}
