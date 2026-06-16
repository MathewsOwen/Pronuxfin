import { readTrimmedEnv } from "@/lib/env/server-env";
import {
  resolveAuthUpstreamTimeoutMs,
} from "@/lib/http/auth-timeout";
import {
  FetchTimeoutError,
  fetchWithTimeout,
} from "@/lib/http/fetch-with-timeout";
import { internalApiHeaders } from "@/lib/http/internal-api-headers";

export function apiBaseUrl(): string {
  return readTrimmedEnv("API_URL").replace(/\/+$/, "");
}

/** Marker error so callers can map an upstream timeout to a clear 504. */
export class AuthUpstreamTimeoutError extends Error {
  constructor() {
    super("Auth upstream timed out");
    this.name = "AuthUpstreamTimeoutError";
  }
}

function authUpstreamTimeoutMs(): number {
  return resolveAuthUpstreamTimeoutMs(apiBaseUrl() || readTrimmedEnv("API_URL"));
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

  const bodyText =
    typeof init?.body === "string"
      ? init.body
      : init?.body == null
        ? ""
        : "";

  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(
    internalApiHeaders({
      method: init?.method ?? "GET",
      path: normalizedPath,
      body: bodyText,
    }),
  )) {
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
