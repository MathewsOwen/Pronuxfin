/** URL pública da API Nest para warm-up no browser (CORS). Não envia segredos. */
export function resolveApiWarmupBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_WARMUP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return "https://pronuxfin.onrender.com";
}

export function apiWarmupLiveUrl(): string {
  return `${resolveApiWarmupBaseUrl()}/health/live`;
}
