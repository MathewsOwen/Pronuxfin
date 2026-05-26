import { readTrimmedEnv } from "@/lib/env/server-env";

export function apiBaseUrl(): string {
  return readTrimmedEnv("API_URL").replace(/\/+$/, "");
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
  return fetch(`${base}${normalizedPath}`, init);
}
