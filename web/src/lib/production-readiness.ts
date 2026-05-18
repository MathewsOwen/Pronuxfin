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
  return process.env.NODE_ENV === "production";
}

async function checkBackendReady(apiUrl: string): Promise<ReadinessCheck> {
  try {
    const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/health/ready`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    return {
      key: "backend_ready",
      ok: res.ok,
      detail: `status ${res.status}`,
    };
  } catch {
    return {
      key: "backend_ready",
      ok: false,
      detail: "request failed",
    };
  }
}

export async function evaluateProductionReadiness(): Promise<ProductionReadiness> {
  const enabled = shouldEnableReadinessGate();
  if (!enabled) {
    return { enabled: false, ok: true, checks: [] };
  }

  const apiUrl = process.env.API_URL?.trim() ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

  const checks: ReadinessCheck[] = [
    {
      key: "api_url_configured",
      ok: apiUrl.length > 0,
      detail: apiUrl.length > 0 ? "configured" : "missing API_URL",
    },
    {
      key: "site_url_configured",
      ok: siteUrl.length > 0,
      detail: siteUrl.length > 0 ? "configured" : "missing NEXT_PUBLIC_SITE_URL",
    },
  ];

  if (apiUrl.length > 0) {
    checks.push(await checkBackendReady(apiUrl));
  } else {
    checks.push({
      key: "backend_ready",
      ok: false,
      detail: "skipped (missing API_URL)",
    });
  }

  return {
    enabled: true,
    ok: checks.every((check) => check.ok),
    checks,
  };
}
