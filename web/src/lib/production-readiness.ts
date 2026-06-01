import { isProductionRuntime } from "@/lib/env/server-env";
import { evaluateWebReadiness } from "@/lib/health/web-readiness";
import { listEnginesFromEnv } from "@/lib/market/market-ai-providers";
import {
  hasPublicSiteUrlConfigured,
  publicSiteUrlReadinessDetail,
} from "@/lib/site-url";

/**
 * Classifica cada check em duas dimensões:
 * - severity=critical: configuração estática (variáveis ausentes/ inválidas).
 *   Sem isto nada funciona — bloqueia o painel privado com `MaintenanceLockScreen`.
 * - severity=runtime: backend/DB temporariamente fora.
 *   Não bloqueia — o `AppShell` exibe banner de degradação e cada página
 *   já trata o seu próprio empty/error state.
 */
export type ReadinessSeverity = "critical" | "runtime";

export type ReadinessCheck = {
  key: string;
  ok: boolean;
  detail: string;
  severity: ReadinessSeverity;
};

export type ProductionReadiness = {
  enabled: boolean;
  /** True quando **todos** os checks (críticos + runtime) passam. */
  ok: boolean;
  /** True quando todos os checks **críticos** passam — apenas estes ativam o gate. */
  criticalOk: boolean;
  /** Razão agregada quando runtime falha (para `SystemDegradationBanner`). */
  runtimeReason?: string;
  checks: ReadinessCheck[];
  /** Apenas checks críticos (subset de `checks`). */
  criticalChecks: ReadinessCheck[];
};

function shouldEnableReadinessGate() {
  if (process.env.MAINTENANCE_FORCE_OFF === "1") return false;
  if (process.env.MAINTENANCE_FORCE_ON === "1") return true;
  // During `next build`, env is often incomplete — do not gate static generation.
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
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
      severity: "critical",
    },
    {
      key: "site_url_configured",
      ok: c.site_url_configured,
      detail: c.site_url_configured ? c.site_url_detail : "missing NEXT_PUBLIC_SITE_URL",
      severity: "critical",
    },
    {
      key: "jwt_secret_configured",
      ok: c.jwt_secret_configured,
      detail: c.jwt_secret_detail,
      severity: "critical",
    },
    {
      key: "database_configured",
      ok: c.database_configured,
      detail: c.database_configured ? "configured" : "missing DATABASE_URL",
      severity: "critical",
    },
    {
      key: "internal_api_secret",
      ok: (process.env.INTERNAL_API_SECRET?.trim().length ?? 0) >= 32,
      detail:
        (process.env.INTERNAL_API_SECRET?.trim().length ?? 0) >= 32
          ? "configured"
          : "missing INTERNAL_API_SECRET (≥32 chars)",
      severity: "critical",
    },
    {
      key: "jwt_rs256",
      ok:
        process.env.JWT_ALGORITHM?.trim().toUpperCase() === "RS256" &&
        (process.env.JWT_PUBLIC_KEY?.includes("BEGIN PUBLIC KEY") ?? false),
      detail:
        process.env.JWT_ALGORITHM?.trim().toUpperCase() === "RS256"
          ? "RS256 configured"
          : "JWT_ALGORITHM=RS256 required in production",
      severity: "critical",
    },
    {
      key: "cookie_samesite_strict",
      ok: process.env.COOKIE_SAMESITE_STRICT?.trim() === "1",
      detail:
        process.env.COOKIE_SAMESITE_STRICT?.trim() === "1"
          ? "strict cookies enabled"
          : "set COOKIE_SAMESITE_STRICT=1",
      severity: "critical",
    },
    {
      key: "ai_keys_encryption",
      ok: (process.env.AI_KEYS_ENCRYPTION_KEY?.trim().length ?? 0) === 64,
      detail:
        (process.env.AI_KEYS_ENCRYPTION_KEY?.trim().length ?? 0) === 64
          ? "configured"
          : "missing AI_KEYS_ENCRYPTION_KEY (64 hex chars)",
      severity: "critical",
    },
    {
      key: "webauthn_production",
      ok:
        !!process.env.WEBAUTHN_RP_ID?.trim() &&
        !!process.env.WEBAUTHN_ORIGIN?.trim()?.startsWith("https://") &&
        !process.env.WEBAUTHN_ORIGIN?.trim()?.endsWith("/"),
      detail:
        process.env.WEBAUTHN_RP_ID?.trim() && process.env.WEBAUTHN_ORIGIN?.trim()
          ? "configured"
          : "set WEBAUTHN_RP_ID + WEBAUTHN_ORIGIN",
      severity: "critical",
    },
    {
      key: "market_ai_engine",
      ok: listEnginesFromEnv().length > 0,
      detail:
        listEnginesFromEnv().length > 0
          ? "configured"
          : "set OPENAI_API_KEY, GEMINI_API_KEY, or PRONUX_MARKET_AI_OLLAMA_ORIGIN",
      severity: "critical",
    },
    {
      key: "backend_ready",
      ok: c.backend_ready,
      detail: c.backend_status != null ? `status ${c.backend_status}` : "request failed",
      severity: "runtime",
    },
    {
      key: "database_ready",
      ok: c.database_ready,
      detail: c.database_ready ? "up" : c.database_configured ? "connection failed" : "skipped",
      severity: "runtime",
    },
  ];
}

function aggregateRuntimeReason(checks: ReadinessCheck[]): string | undefined {
  const failed = checks.filter((c) => c.severity === "runtime" && !c.ok);
  if (failed.length === 0) return undefined;
  if (failed.length === 1) {
    return failed[0]!.key === "backend_ready"
      ? "API principal indisponível ou em inicialização."
      : "Base de dados indisponível.";
  }
  return "API principal e base de dados indisponíveis.";
}

export async function evaluateProductionReadiness(): Promise<ProductionReadiness> {
  const enabled = shouldEnableReadinessGate();
  if (!enabled) {
    return {
      enabled: false,
      ok: true,
      criticalOk: true,
      checks: [],
      criticalChecks: [],
    };
  }

  const web = await evaluateWebReadiness();
  const checks = toReadinessChecks(web);
  const criticalChecks = checks.filter((c) => c.severity === "critical");
  const criticalOk = criticalChecks.every((c) => c.ok);
  const ok = checks.every((c) => c.ok);
  const runtimeReason = aggregateRuntimeReason(checks);

  return {
    enabled: true,
    ok,
    criticalOk,
    runtimeReason,
    checks,
    criticalChecks,
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
      severity: "critical",
    },
  ];
}
