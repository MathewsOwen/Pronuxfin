import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Project root (directory of this config). Must match `outputFileTracingRoot` and `turbopack.root`. */
const webDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: webDir,
  turbopack: {
    root: webDir,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
      },
      {
        protocol: "https",
        hostname: "icons.brapi.dev",
      },
    ],
  },
  async headers() {
    const apiHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      { key: "Cache-Control", value: "no-store" },
    ];
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      { key: "Origin-Agent-Cluster", value: "?1" },
    ];
    const prodHeaders =
      process.env.NODE_ENV === "production" &&
      process.env.PLAYWRIGHT_E2E !== "1";
    if (prodHeaders) {
      base.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      base.push({
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      });
    }
    return [
      { source: "/api/:path*", headers: apiHeaders },
      { source: "/:path*", headers: base },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: !!process.env.CI,
  telemetry: false,
});
