/**
 * Agrupa eventos de degradação no Sentry por causa provável (evita um issue por string ligeiramente diferente).
 */
export function classifyDegradedReason(reason?: string): string {
  if (!reason?.trim()) return "unknown";
  if (reason.includes("API_URL")) return "frontend_api_url_missing";
  if (reason.includes("JWT_SECRET")) return "frontend_jwt_misconfigured";
  if (reason.includes("DATABASE_URL")) return "frontend_database_misconfigured";
  if (reason.includes("indisponível") || reason.includes("inicialização")) {
    return "backend_not_ready_or_warming";
  }
  if (reason.includes("conectividade")) return "backend_connectivity";
  return "other";
}

export function degradedStatusFingerprint(reason?: string): string[] {
  return ["pronux-platform-status", "degraded", classifyDegradedReason(reason)];
}

export function recoveredStatusFingerprint(): string[] {
  return ["pronux-platform-status", "recovered"];
}
