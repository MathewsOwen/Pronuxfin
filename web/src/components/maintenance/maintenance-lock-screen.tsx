import { AlertTriangle, LineChart, RefreshCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductionReadiness, ReadinessCheck } from "@/lib/production-readiness";

type CriticalCheckKey =
  | "api_url_configured"
  | "site_url_configured"
  | "jwt_secret_configured"
  | "database_configured"
  | "internal_api_secret"
  | "jwt_rs256"
  | "cookie_samesite_strict"
  | "ai_keys_encryption"
  | "webauthn_production"
  | "market_ai_engine";

const FAIL_LABEL_KEYS: Record<CriticalCheckKey, string> = {
  api_url_configured: "checks.apiUrlMissing",
  site_url_configured: "checks.siteUrlMissing",
  jwt_secret_configured: "checks.jwtSecretMissing",
  database_configured: "checks.databaseMissing",
  internal_api_secret: "checks.internalApiSecretMissing",
  jwt_rs256: "checks.jwtRs256Missing",
  cookie_samesite_strict: "checks.cookieSameSiteMissing",
  ai_keys_encryption: "checks.aiKeysEncryptionMissing",
  webauthn_production: "checks.webauthnMissing",
  market_ai_engine: "checks.marketAiMissing",
};

const CHECK_LABEL_KEYS: Record<CriticalCheckKey, string> = {
  api_url_configured: "checks.apiUrlLabel",
  site_url_configured: "checks.siteUrlLabel",
  jwt_secret_configured: "checks.jwtSecretLabel",
  database_configured: "checks.databaseLabel",
  internal_api_secret: "checks.internalApiSecretLabel",
  jwt_rs256: "checks.jwtRs256Label",
  cookie_samesite_strict: "checks.cookieSameSiteLabel",
  ai_keys_encryption: "checks.aiKeysEncryptionLabel",
  webauthn_production: "checks.webauthnLabel",
  market_ai_engine: "checks.marketAiLabel",
};

function isCriticalCheckKey(key: string): key is CriticalCheckKey {
  return key in CHECK_LABEL_KEYS;
}

export async function MaintenanceLockScreen({
  readiness,
}: {
  readiness: ProductionReadiness;
}) {
  const t = await getTranslations("Maintenance");
  const failedCritical = readiness.criticalChecks.filter((c) => !c.ok);

  return (
    <main className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-16">
      <div className="glass-panel glow-ring w-full rounded-3xl border-white/12 px-8 py-12 ring-1 ring-white/[0.04] sm:px-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-status-warning/12 text-status-warning">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="font-heading mt-5 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("headline")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
          {t("body")}
        </p>

        {failedCritical.length > 0 ? (
          <div className="mt-8 rounded-2xl border border-status-warning/25 bg-status-warning/[0.06] p-5 text-left">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-status-warning/90">
              {t("checksLabel")}
            </p>
            <ul className="space-y-2 text-sm">
              {failedCritical.map((check) => (
                <FailedCheckRow key={check.key} check={check} t={t} />
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("operatorHint")}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/bolsa"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full justify-center gap-2 glow-ring",
            )}
          >
            <LineChart className="size-4" aria-hidden />
            {t("ctaPublicDesk")}
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full justify-center gap-2 border-white/15 bg-white/[0.03]",
            )}
          >
            <RefreshCcw className="size-4" aria-hidden />
            {t("ctaRetry")}
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("publicAlternatives")}
        </p>
      </div>
    </main>
  );
}

function FailedCheckRow({
  check,
  t,
}: {
  check: ReadinessCheck;
  t: Awaited<ReturnType<typeof getTranslations<"Maintenance">>>;
}) {
  if (!isCriticalCheckKey(check.key)) {
    return (
      <li className="flex flex-col gap-1 rounded-lg border border-white/10 bg-background/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-foreground/90">{check.key}</span>
        <span className="font-mono text-xs text-market-down">{check.detail}</span>
      </li>
    );
  }

  const labelKey = CHECK_LABEL_KEYS[check.key];
  const failKey = FAIL_LABEL_KEYS[check.key];

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-white/10 bg-background/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-foreground/90">{t(labelKey)}</span>
      <span className="font-mono text-xs text-market-down">{t(failKey)}</span>
    </li>
  );
}
