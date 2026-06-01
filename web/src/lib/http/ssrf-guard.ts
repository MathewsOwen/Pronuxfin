import dns from "node:dns/promises";

/** Blocks link-local, private, and metadata IP literals in URLs. */
export function isBlockedHost(hostname: string): boolean {  const host = hostname.trim().toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local")) return true;

  // IPv6
  if (host.startsWith("[") && host.endsWith("]")) {
    const inner = host.slice(1, -1).toLowerCase();
    if (inner === "::1") return true;
    if (inner.startsWith("fc") || inner.startsWith("fd")) return true; // unique local
    if (inner.startsWith("fe80")) return true; // link-local
    return false;
  }

  // IPv4 literal
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) return false;

  const octets = ipv4.slice(1, 5).map((n) => Number(n));
  if (octets.some((n) => n > 255)) return true;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT / metadata adjacency

  return false;
}

export function isSafeHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (isBlockedHost(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Resolves hostname and rejects DNS rebinding to private/metadata ranges. */
export async function resolveHostForFetch(hostname: string): Promise<boolean> {
  const host = hostname.trim().toLowerCase();
  if (!host || isBlockedHost(host)) return false;

  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (ipv4 || (host.startsWith("[") && host.endsWith("]"))) {
    return !isBlockedHost(host);
  }

  try {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    if (records.length === 0) return false;
    return records.every((record) => !isBlockedHost(record.address));
  } catch {
    return false;
  }
}

/** Full SSRF guard: scheme + credentials + hostname literal + DNS resolution. */
export async function assertSafeFetchTarget(raw: string): Promise<boolean> {
  if (!isSafeHttpUrl(raw)) return false;
  const { hostname } = new URL(raw);
  return resolveHostForFetch(hostname);
}