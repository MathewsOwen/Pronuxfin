import { isProductionRuntime } from "@/lib/env/server-env";
import { evaluateWebReadiness } from "@/lib/health/web-readiness";
import {
  hasPublicSiteUrlConfigured,
  publicSiteUrlReadinessDetail,
} from "@/lib/site-url";

type ReadinessCheck = {
  key: string;
  ok: boolean;
  detail: string;
};

export type ProductionReadiness = {
  enabled: boolean;
  ok: boolean;
  checks: ReadinessCheck[];
};

function shouldEnableReadinessGate() {
  if (process.env.MAINTENANCE_FORCE_OFF === "1") return false;
  if (process.env.MAINTENANCE_FORCE_ON === "1") return true;
  return isProductionRuntime();
}

function toReadinessChecks(
  web: Awaited<ReturnType<typeof evaluateWebReadiness>>,
): ReadinessCheck[] {
  const c = web.checks;
  return [
    {
      key: "api_url_configured",
      ok: c.api_url_configured,
      detail: c.api_url_configured ? "configured" : "missing API_URL",
    },
    {
      key: "site_url_configured",
      ok: c.site_url_configured,
      detail: c.site_url_configured ? c.site_url_detail : "missing NEXT_PUBLIC_SITE_URL",
    },
    {
      key: "jwt_secret_configured",
      ok: c.jwt_secret_configured,
      detail: c.jwt_secret_detail,
    },
    {
      key: "database_configured",
      ok: c.database_configured,
      detail: c.database_configured ? "configured" : "missing DATABASE_URL",
    },
    {
      key: "backend_ready",
      ok: c.backend_ready,
      detail: c.backend_status != null ? `status ${c.backend_status}` : "request failed",
    },
    {
      key: "database_ready",
      ok: c.database_ready,
      detail: c.database_ready ? "up" : c.database_configured ? "connection failed" : "skipped",
    },
  ];
}

export async function evaluateProductionReadiness(): Promise<ProductionReadiness> {
  const enabled = shouldEnableReadinessGate();
  if (!enabled) {
    return { enabled: false, ok: true, checks: [] };
  }

  const web = await evaluateWebReadiness();
  const checks = toReadinessChecks(web);

  return {
    enabled: true,
    ok: checks.every((check) => check.ok),
    checks,
  };
}

/** Usado em testes e documentação — checks mínimos sem consultar rede/DB. */
export function evaluateStaticProductionConfig(): ReadinessCheck[] {
  const siteConfigured = hasPublicSiteUrlConfigured();
  return [
    {
      key: "site_url_configured",
      ok: siteConfigured,
      detail: siteConfigured ? publicSiteUrlReadinessDetail() : "missing NEXT_PUBLIC_SITE_URL",
    },
  ];
}
