/** Default ceiling for market data providers (BRAPI, Yahoo, CoinGecko, FMP, RSS). */
export const DEFAULT_MARKET_FETCH_TIMEOUT_MS = 12_000;

/** LLM / Ollama calls may run longer than quote snapshots. */
export const DEFAULT_LLM_FETCH_TIMEOUT_MS = 90_000;

export class FetchTimeoutError extends Error {
  readonly label: string;

  constructor(label = "fetch") {
    super(`${label} timed out`);
    this.name = "FetchTimeoutError";
    this.label = label;
  }
}

function readTimeoutMs(envKey: string, fallback: number): number {
  const raw = Number(process.env[envKey]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export function marketFetchTimeoutMs(): number {
  return readTimeoutMs(
    "MARKET_FETCH_TIMEOUT_MS",
    DEFAULT_MARKET_FETCH_TIMEOUT_MS,
  );
}

export function llmFetchTimeoutMs(): number {
  return readTimeoutMs("LLM_FETCH_TIMEOUT_MS", DEFAULT_LLM_FETCH_TIMEOUT_MS);
}

function mergeAbortSignals(
  primary: AbortSignal,
  secondary: AbortSignal,
): AbortSignal {
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([primary, secondary]);
  }
  const merged = new AbortController();
  const abort = () => merged.abort();
  primary.addEventListener("abort", abort);
  secondary.addEventListener("abort", abort);
  if (primary.aborted || secondary.aborted) abort();
  return merged.signal;
}

/**
 * `fetch` with a hard timeout. Propagates caller `signal` when provided.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init?: RequestInit,
  options?: { timeoutMs?: number; label?: string },
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? marketFetchTimeoutMs();
  const label = options?.label ?? "fetch";
  const external = init?.signal;
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  const signal = external
    ? mergeAbortSignals(external, timeoutController.signal)
    : timeoutController.signal;

  try {
    return await fetch(input, { ...init, signal });
  } catch (err) {
    if (timeoutController.signal.aborted && !external?.aborted) {
      throw new FetchTimeoutError(label);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchMarket(input: string | URL, init?: RequestInit) {
  return fetchWithTimeout(input, init, {
    timeoutMs: marketFetchTimeoutMs(),
    label: "market",
  });
}

export function fetchLlm(input: string | URL, init?: RequestInit) {
  return fetchWithTimeout(input, init, {
    timeoutMs: llmFetchTimeoutMs(),
    label: "llm",
  });
}
