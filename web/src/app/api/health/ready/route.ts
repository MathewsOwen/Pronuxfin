import { NextResponse } from "next/server";

import { evaluateEnterpriseSecurityHints } from "@/lib/env/enterprise-security";
import { evaluateWebReadiness } from "@/lib/health/web-readiness";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";
import { secureCompareStrings } from "@/lib/security/secure-compare";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SERVICE = "pronuxfin-web";
const READY_PROBE_WINDOW_MS = 60_000;
const READY_PROBE_MAX = 60;

function probeAuthorized(req: Request): boolean {
  const secret = process.env.HEALTH_PROBE_SECRET?.trim();
  if (!secret || secret.length < 32) return false;
  const auth = req.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length).trim();
  return secureCompareStrings(token, secret);
}

export async function GET(req: Request) {
  const limited = await rateLimitResponse(
    "health-ready",
    READY_PROBE_MAX,
    READY_PROBE_WINDOW_MS,
    { failClosed: false, req },
  );
  if (limited) return limited;

  const { ok, checks } = await evaluateWebReadiness();
  const timestamp = new Date().toISOString();
  const detailed = probeAuthorized(req);

  const failedChecks = (
    [
      ["api_url_configured", checks.api_url_configured],
      ["site_url_configured", checks.site_url_configured],
      ["jwt_secret_configured", checks.jwt_secret_configured],
      ["backend_ready", checks.backend_ready],
      ["database_configured", checks.database_configured],
      ["database_ready", checks.database_ready],
    ] as const
  )
    .filter(([, pass]) => !pass)
    .map(([name]) => name);

  const body = detailed
    ? {
        ok,
        service: SERVICE,
        check: "ready" as const,
        timestamp,
        checks,
        enterprise_hints: evaluateEnterpriseSecurityHints(),
      }
    : {
        ok,
        service: SERVICE,
        check: "ready" as const,
        timestamp,
        ...(failedChecks.length > 0 ? { failed_checks: failedChecks } : {}),
      };

  const res = NextResponse.json(body, { status: ok ? 200 : 503 });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
