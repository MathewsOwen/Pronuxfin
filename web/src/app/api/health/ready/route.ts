import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hasPublicSiteUrlConfigured } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SERVICE = "pronuxfin-web";

async function checkBackend(apiUrl: string) {
  try {
    const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/health/ready`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false as const, status: null };
  }
}

async function checkDatabase() {
  if (!process.env.DATABASE_URL?.trim()) {
    return { configured: false as const, ok: false as const };
  }

  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return { configured: true as const, ok: true as const };
  } catch {
    return { configured: true as const, ok: false as const };
  }
}

function probeAuthorized(req: Request): boolean {
  const secret = process.env.HEALTH_PROBE_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization")?.trim();
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  const apiUrl = process.env.API_URL?.trim() ?? "";
  const siteUrlConfigured = hasPublicSiteUrlConfigured();

  const [backend, db] = await Promise.all([
    apiUrl ? checkBackend(apiUrl) : Promise.resolve({ ok: false as const, status: null }),
    checkDatabase(),
  ]);

  const checks = {
    api_url_configured: apiUrl.length > 0,
    site_url_configured: siteUrlConfigured,
    backend_ready: backend.ok,
    backend_status: backend.status,
    database_configured: db.configured,
    database_ready: db.ok,
  };

  const ok =
    checks.api_url_configured &&
    checks.site_url_configured &&
    checks.backend_ready &&
    checks.database_configured &&
    checks.database_ready;

  const timestamp = new Date().toISOString();
  const detailed = probeAuthorized(req);

  const body = detailed
    ? {
        ok,
        service: SERVICE,
        check: "ready" as const,
        timestamp,
        checks,
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
