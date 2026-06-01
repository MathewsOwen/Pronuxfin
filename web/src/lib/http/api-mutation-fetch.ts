"use client";

import { CSRF_HEADER } from "@/lib/security/csrf-constants";

function readBrowserCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)pronuxfin_csrf=([^;]*)/);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

/**
 * Same-origin fetch for POST/PATCH/DELETE with the CSRF double-submit header.
 */
export async function apiMutation(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const csrf = readBrowserCsrfToken();
  if (csrf) headers.set(CSRF_HEADER, csrf);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? "same-origin",
  });
}
