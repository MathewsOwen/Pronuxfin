import { ConfigService } from '@nestjs/config';

function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(/[,;]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );
}

/** When `PLATFORM_ADMIN_IP_ALLOWLIST` is set, admin logins must originate from listed IPs. */
export function isPlatformAdminIpAllowed(
  ip: string | null | undefined,
  config: ConfigService,
): boolean {
  const allowlist = parseAllowlist(
    config.get<string>('PLATFORM_ADMIN_IP_ALLOWLIST'),
  );
  if (allowlist.size === 0) return true;
  if (!ip?.trim()) return false;
  return allowlist.has(ip.trim());
}
