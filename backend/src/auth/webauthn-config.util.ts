import type { ConfigService } from '@nestjs/config';

export type WebAuthnRuntimeConfig = {
  rpName: string;
  rpID: string;
  origin: string;
};

export function resolveWebAuthnConfig(
  config: ConfigService,
): WebAuthnRuntimeConfig {
  const origin =
    config.get<string>('WEBAUTHN_ORIGIN')?.trim() ||
    config.get<string>('FRONTEND_URL')?.trim() ||
    'http://127.0.0.1:3000';
  const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

  const rpID =
    config.get<string>('WEBAUTHN_RP_ID')?.trim() ||
    hostnameFromOrigin(normalizedOrigin);

  const rpName = config.get<string>('WEBAUTHN_RP_NAME')?.trim() || 'PRONUXFIN';

  return { rpName, rpID, origin: normalizedOrigin };
}

function hostnameFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return 'localhost';
  }
}
