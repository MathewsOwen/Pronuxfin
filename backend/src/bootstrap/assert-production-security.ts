import { Logger } from '@nestjs/common';

const log = new Logger('Bootstrap');

function isTruthyEnv(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function assertProductionSecurityConfig(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const internal = process.env.INTERNAL_API_SECRET?.trim() ?? '';
  if (internal.length < 32) {
    log.error(
      'INTERNAL_API_SECRET ausente ou curto (<32). A API não pode iniciar em produção sem isolamento BFF.',
    );
    process.exit(1);
  }

  const algo = process.env.JWT_ALGORITHM?.trim().toUpperCase();
  if (algo !== 'RS256') {
    log.error('JWT_ALGORITHM=RS256 é obrigatório em produção.');
    process.exit(1);
  }

  const privateKey = process.env.JWT_PRIVATE_KEY?.trim() ?? '';
  const publicKey = process.env.JWT_PUBLIC_KEY?.trim() ?? '';
  if (
    !privateKey.includes('BEGIN PRIVATE KEY') ||
    !publicKey.includes('BEGIN PUBLIC KEY')
  ) {
    log.error(
      'JWT_PRIVATE_KEY e JWT_PUBLIC_KEY (RS256) são obrigatórios em produção.',
    );
    process.exit(1);
  }

  const frontend = process.env.FRONTEND_URL?.trim() ?? '';
  if (!frontend) {
    log.error('FRONTEND_URL ausente — CORS inseguro em produção.');
    process.exit(1);
  }

  if (!isTruthyEnv('REFRESH_STRICT_BIND')) {
    log.error(
      'REFRESH_STRICT_BIND deve estar activo em produção (REFRESH_STRICT_BIND=1).',
    );
    process.exit(1);
  }

  const smtpUrl = process.env.SMTP_URL?.trim() ?? '';
  const smtpFrom = process.env.SMTP_FROM?.trim() ?? '';
  const devLogOnly = process.env.AUTH_RESET_DEV_LOG_ONLY === 'true';
  if ((!smtpUrl || !smtpFrom) && !devLogOnly) {
    log.error(
      'SMTP_URL + SMTP_FROM são obrigatórios em produção (ou AUTH_RESET_DEV_LOG_ONLY=true só em staging).',
    );
    process.exit(1);
  }

  if (devLogOnly) {
    log.warn(
      'AUTH_RESET_DEV_LOG_ONLY=true — reset de senha não envia e-mail real.',
    );
  }

  if (!isTruthyEnv('TRUST_PROXY')) {
    log.error('TRUST_PROXY=1 é obrigatório em produção (IP real / rate limit).');
    process.exit(1);
  }

  const rpId = process.env.WEBAUTHN_RP_ID?.trim() ?? '';
  const webauthnOrigin = process.env.WEBAUTHN_ORIGIN?.trim() ?? '';
  if (
    !rpId ||
    !webauthnOrigin ||
    !webauthnOrigin.startsWith('https://') ||
    webauthnOrigin.endsWith('/')
  ) {
    log.error(
      'WEBAUTHN_RP_ID e WEBAUTHN_ORIGIN (https, sem barra final) são obrigatórios em produção.',
    );
    process.exit(1);
  }

  if (process.env.INTERNAL_API_REQUEST_SIGNING === '0') {
    log.error('INTERNAL_API_REQUEST_SIGNING=0 é proibido em produção.');
    process.exit(1);
  }
  if (!isTruthyEnv('INTERNAL_API_REQUEST_SIGNING')) {
    log.error('INTERNAL_API_REQUEST_SIGNING=1 é obrigatório em produção.');
    process.exit(1);
  }
}
