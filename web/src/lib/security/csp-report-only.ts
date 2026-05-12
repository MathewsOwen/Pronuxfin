/**

 * Content-Security-Policy-Report-Only — não bloqueia o browser; apenas gera relatórios

 * (única via segura para evoluir depressa sem partir hidratação do Next/Vercel).

 *

 * Diretivas permissivas só onde o framework o exige (inline scripts/styles).

 *

 * Quando `NEXT_PUBLIC_SENTRY_DSN` existe, amplia script/connect para ingest legítimo.

 */

export function getContentSecurityPolicyReportOnly(

  isProd: boolean,

  opts?: { sentryBrowser?: boolean },

): string {

  const sentryBrowser =

    opts?.sentryBrowser ?? !!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();



  const scriptExtras = ["'unsafe-inline'"];

  if (!isProd) {

    scriptExtras.push("'wasm-unsafe-eval'", "'unsafe-eval'");

  }



  const scriptHosts =

    (isProd ? " https://vercel.live https://vitals.vercel-insights.com" : "") +

    (sentryBrowser ? " https://browser.sentry-cdn.com" : "");



  const scriptSrc = `'self' ${scriptExtras.join(" ")}${scriptHosts}`;



  const connectParts: string[] = ["'self'"];

  if (isProd) {

    connectParts.push("https://vitals.vercel-insights.com");

  }

  if (sentryBrowser) {

    connectParts.push("https://*.ingest.us.sentry.io");

    connectParts.push("https://*.ingest.de.sentry.io");

    connectParts.push("https://*.ingest.sentry.io");

    connectParts.push("https://browser.sentry-cdn.com");

  }



  return [

    "default-src 'self'",

    "base-uri 'self'",

    "frame-ancestors 'self'",

    "object-src 'none'",

    `script-src ${scriptSrc}`,

    "style-src 'self' 'unsafe-inline'",

    /** Imagens CDN externas só se aparecerem no DOM; relatórios vão mostrar o que falta. */

    "img-src 'self' data: blob: https:",

    "font-src 'self' data:",

    `connect-src ${connectParts.join(" ")}`,

    "worker-src 'self' blob:",

    "manifest-src 'self'",

    "report-uri /api/security/csp-report",

  ]

    .join("; ")

    .replace(/\s+/g, " ")

    .trim();

}

