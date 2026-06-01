import { readTrimmedEnv } from "@/lib/env/server-env";
import {
  FetchTimeoutError,
  fetchWithTimeout,
} from "@/lib/http/fetch-with-timeout";
import { internalApiHeaders } from "@/lib/http/internal-api-headers";

export function apiBaseUrl(): string {
  return readTrimmedEnv("API_URL").replace(/\/+$/, "");
}

const DEFAULT_AUTH_TIMEOUT_MS = 12_000;

/** Marker error so callers can map an upstream timeout to a clear 504. */
export class AuthUpstreamTimeoutError extends Error {
  constructor() {
    super("Auth upstream timed out");
    this.name = "AuthUpstreamTimeoutError";
  }
}

function authUpstreamTimeoutMs(): number {
  const raw = Number(process.env.AUTH_UPSTREAM_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_AUTH_TIMEOUT_MS;
}

export async function fetchAuthUpstream(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error("API_URL is not configured");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // A backend cold start (e.g. idle Render dyno) could otherwise leave the
  // request hanging indefinitely; bound it so the user gets a fast, clear
  // answer instead of a spinner stuck for tens of seconds.
  // Prove this call comes from the trusted BFF (see InternalApiGuard).
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(internalApiHeaders())) {
    headers.set(k, v);
  }

  try {
    return await fetchWithTimeout(`${base}${normalizedPath}`, {
      ...init,
      headers,
    }, {
      timeoutMs: authUpstreamTimeoutMs(),
      label: "auth",
      ssrfGuard: false,
    });
  } catch (err) {
    if (err instanceof FetchTimeoutError) {
      throw new AuthUpstreamTimeoutError();
    }
    throw err;
  }
}
