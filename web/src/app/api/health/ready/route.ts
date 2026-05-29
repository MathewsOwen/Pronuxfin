import { NextResponse } from "next/server";

import { evaluateEnterpriseSecurityHints } from "@/lib/env/enterprise-security";
import { evaluateWebReadiness } from "@/lib/health/web-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SERVICE = "pronuxfin-web";

function probeAuthorized(req: Request): boolean {
  const secret = process.env.HEALTH_PROBE_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization")?.trim();
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  const { ok, checks } = await evaluateWebReadiness();
  const timestamp = new Date().toISOString();
  const detailed = probeAuthorized(req);

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
      };

  const res = NextResponse.json(body, { status: ok ? 200 : 503 });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
