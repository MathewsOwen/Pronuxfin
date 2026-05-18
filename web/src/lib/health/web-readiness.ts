import { Prisma } from "@prisma/client";

import {
  isApiUrlConfigured,
  isDatabaseUrlConfigured,
  isJwtSecretConfigured,
  jwtSecretReadinessDetail,
  readTrimmedEnv,
} from "@/lib/env/server-env";
import { prisma } from "@/lib/prisma";
import {
  hasPublicSiteUrlConfigured,
  publicSiteUrlReadinessDetail,
} from "@/lib/site-url";

const BACKEND_CHECK_TIMEOUT_MS = 4_000;

export type WebReadinessChecks = {
  api_url_configured: boolean;
  site_url_configured: boolean;
  site_url_detail: string;
  jwt_secret_configured: boolean;
  jwt_secret_detail: string;
  backend_ready: boolean;
  backend_status: number | null;
  database_configured: boolean;
  database_ready: boolean;
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function checkBackendReady(apiUrl: string): Promise<{ ok: boolean; status: number | null }> {
  try {
    const res = await withTimeout(
      fetch(`${apiUrl.replace(/\/+$/, "")}/health/ready`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
      BACKEND_CHECK_TIMEOUT_MS,
    );
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  }
}

async function checkDatabaseReady(): Promise<boolean> {
  if (!isDatabaseUrlConfigured()) return false;
  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

export async function evaluateWebReadiness(): Promise<{
  ok: boolean;
  checks: WebReadinessChecks;
}> {
  const apiUrl = readTrimmedEnv("API_URL");
  const siteConfigured = hasPublicSiteUrlConfigured();

  const [backend, databaseReady] = await Promise.all([
    apiUrl.length > 0 ? checkBackendReady(apiUrl) : Promise.resolve({ ok: false, status: null }),
    checkDatabaseReady(),
  ]);

  const checks: WebReadinessChecks = {
    api_url_configured: isApiUrlConfigured(),
    site_url_configured: siteConfigured,
    site_url_detail: siteConfigured ? publicSiteUrlReadinessDetail() : "missing",
    jwt_secret_configured: isJwtSecretConfigured(),
    jwt_secret_detail: jwtSecretReadinessDetail(),
    backend_ready: backend.ok,
    backend_status: backend.status,
    database_configured: isDatabaseUrlConfigured(),
    database_ready: databaseReady,
  };

  const ok =
    checks.api_url_configured &&
    checks.site_url_configured &&
    checks.jwt_secret_configured &&
    checks.backend_ready &&
    checks.database_configured &&
    checks.database_ready;

  return { ok, checks };
}
