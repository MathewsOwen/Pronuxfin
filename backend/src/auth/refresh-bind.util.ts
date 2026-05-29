import type { TokenMeta } from './refresh-token.service';

export function isRefreshStrictBindEnabled(): boolean {
  const raw = process.env.REFRESH_STRICT_BIND?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/**
 * When strict bind is on, a refresh from a different IP or User-Agent than the
 * one recorded at issuance is treated as theft → caller should revoke the family.
 */
export function refreshMetaMismatch(
  stored: { userAgent: string | null; ip: string | null },
  incoming: TokenMeta | undefined,
): boolean {
  if (!isRefreshStrictBindEnabled()) return false;

  const ua = incoming?.userAgent?.trim() || null;
  const ip = incoming?.ip?.trim() || null;

  if (stored.ip && ip && stored.ip !== ip) return true;
  if (stored.userAgent && ua && stored.userAgent !== ua) return true;
  return false;
}
