import { Logger } from '@nestjs/common';

const log = new Logger('Bootstrap');

export function logProductionWarnings(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const jwt = process.env.JWT_SECRET?.trim() ?? '';
  if (jwt.length < 32) {
    log.warn(
      'JWT_SECRET ausente ou curto (<32). Auth e sessões não são seguras para produção.',
    );
  }

  const frontendUrl = process.env.FRONTEND_URL?.trim() ?? '';
  if (!frontendUrl) {
    log.warn(
      'FRONTEND_URL não definido — CORS e links de reset de senha podem falhar.',
    );
  }

  const smtpUrl = process.env.SMTP_URL?.trim() ?? '';
  const smtpFrom = process.env.SMTP_FROM?.trim() ?? '';
  const devLogOnly = process.env.AUTH_RESET_DEV_LOG_ONLY === 'true';

  if (!smtpUrl || !smtpFrom) {
    if (devLogOnly) {
      log.warn(
        'SMTP não configurado e AUTH_RESET_DEV_LOG_ONLY=true — recuperação de senha não envia e-mail real.',
      );
    } else {
      log.error(
        'SMTP_URL/SMTP_FROM ausentes em produção — recuperação de senha ficará indisponível.',
      );
    }
  }

  const db = process.env.DATABASE_URL?.trim() ?? '';
  if (!db) {
    log.error('DATABASE_URL ausente — API não está pronta para produção.');
  }
}
