const DEFAULT_PATH = "/dashboard";

/** Evita open redirect — só paths internos absolutos. */
export function safeInternalRedirectPath(
  raw: string | null | undefined,
  fallback = DEFAULT_PATH,
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("://") || path.includes("@")) return fallback;
  return path;
}
