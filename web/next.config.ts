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
    ];
    if (process.env.NODE_ENV === "production") {
      base.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
      base.push({
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      });
    }
    return [{ source: "/:path*", headers: base }];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: !!process.env.CI,
  telemetry: false,
});
