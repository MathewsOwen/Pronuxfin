const DEFAULT_JWT_EXPIRES_SEC = 604_800;

export function resolveJwtExpiresSec(raw: string | number | undefined): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_JWT_EXPIRES_SEC;
  }

  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_JWT_EXPIRES_SEC;
  }

  return DEFAULT_JWT_EXPIRES_SEC;
}
