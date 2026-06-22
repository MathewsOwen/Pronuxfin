/**
 * Content-Security-Policy with per-request nonce (middleware).
 *
 * Modes (`CSP_MODE`):
 * - `enforce` — blocks violations (production default when unset)
 * - `report-only` — logs to /api/security/csp-report without blocking
 * - `off` — no CSP header (development default when unset)
 *
 * `script-src` uses `'nonce-…' 'strict-dynamic'` instead of `'unsafe-inline'`,
 * which is the real XSS mitigation. `style-src` keeps `'unsafe-inline'` because
 * Tailwind / Next / WebGL stacks still emit inline styles.
 */

export type CspMode = "off" | "report-only" | "enforce";

export function resolveCspMode(): CspMode {
  const raw = process.env.CSP_MODE?.trim().toLowerCase();
  if (raw === "off" || raw === "report-only" || raw === "enforce") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "enforce" : "report-only";
}

export function cspHeaderName(mode: CspMode): string | null {
  if (mode === "off") return null;
  return mode === "enforce"
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";
}

export function buildContentSecurityPolicy(opts: {
  nonce: string;
  isProd: boolean;
  sentryBrowser?: boolean;
}): string {
  const { nonce, isProd } = opts;
  const sentryBrowser =
    opts.sentryBrowser ?? !!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

  const scriptParts = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (!isProd) {
    scriptParts.push("'wasm-unsafe-eval'", "'unsafe-eval'", "'unsafe-inline'");
  } else {
    // Three.js / WebGL (intro 3D e fundo ambiente)
    scriptParts.push("'wasm-unsafe-eval'");
  }

  const scriptHosts =
    (isProd ? " https://vercel.live https://vitals.vercel-insights.com" : "") +
    (sentryBrowser ? " https://browser.sentry-cdn.com" : "");

  const scriptSrc = `${scriptParts.join(" ")}${scriptHosts}`;

  const connectParts: string[] = ["'self'"];
  if (isProd) {
    connectParts.push("https://vitals.vercel-insights.com");
  }
  if (sentryBrowser) {
    connectParts.push(
      "https://*.ingest.us.sentry.io",
      "https://*.ingest.de.sentry.io",
      "https://*.ingest.sentry.io",
      "https://browser.sentry-cdn.com",
    );
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
    "object-src 'none'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    `connect-src ${connectParts.join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "report-uri /api/security/csp-report",
  ];

  if (isProd && process.env.PLAYWRIGHT_E2E !== "1") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ").replace(/\s+/g, " ").trim();
}

/** @deprecated Use buildContentSecurityPolicy — kept for next.config during migration. */
export function getContentSecurityPolicyReportOnly(
  isProd: boolean,
  opts?: { sentryBrowser?: boolean },
): string {
  return buildContentSecurityPolicy({
    nonce: "report-only-placeholder",
    isProd,
    sentryBrowser: opts?.sentryBrowser,
  });
}
