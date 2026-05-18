import { ConfigService } from '@nestjs/config';

/** Papel reconhecido no JWT e em `/auth/me` quando o e-mail está na allowlist. */
export const PLATFORM_ADMIN_ROLE = 'platform_admin' as const;

function adminEmailSet(config: ConfigService): Set<string> {
  const raw = config.get<string>('PLATFORM_ADMIN_EMAILS')?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0),
  );
}

/** E-mails listados em `PLATFORM_ADMIN_EMAILS` (separados por vírgula ou ponto e vírgula). */
export function rolesForEmail(email: string, config: ConfigService): string[] {
  return adminEmailSet(config).has(email.trim().toLowerCase())
    ? [PLATFORM_ADMIN_ROLE]
    : [];
}
