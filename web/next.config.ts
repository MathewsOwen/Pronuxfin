import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";
import { getContentSecurityPolicyReportOnly } from "./src/lib/security/csp-report-only";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(process.cwd()),
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
    if (process.env.ENABLE_CSP_REPORT_ONLY === "1") {
      const sentryBrowser =
        process.env.NEXT_PUBLIC_SENTRY_BUILD_CSP_HINT === "1" ||
        !!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

      base.push({
        key: "Content-Security-Policy-Report-Only",
        value: getContentSecurityPolicyReportOnly(
          process.env.NODE_ENV === "production",
          { sentryBrowser },
        ),
      });
    }
    return [{ source: "/:path*", headers: base }];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: !!process.env.CI,
  telemetry: false,
});
