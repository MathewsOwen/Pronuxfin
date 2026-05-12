import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type ResetMailPayload = {
  email: string;
  resetUrl: string;
  locale: 'pt-BR' | 'en';
  expiresMinutes: number;
};

@Injectable()
export class AuthMailerService {
  private readonly logger = new Logger(AuthMailerService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    const smtpUrl = this.config.get<string>('SMTP_URL')?.trim();
    this.transporter = smtpUrl ? nodemailer.createTransport(smtpUrl) : null;
  }

  canSendPasswordReset(): boolean {
    return this.isSmtpReady() || this.canUseDevLogFallback();
  }

  async sendPasswordResetEmail(payload: ResetMailPayload): Promise<void> {
    if (this.isSmtpReady()) {
      await this.transporter!.sendMail({
        from: this.config.getOrThrow<string>('SMTP_FROM'),
        to: payload.email,
        subject: this.subject(payload.locale),
        text: this.textBody(payload),
        html: this.htmlBody(payload),
      });
      return;
    }

    if (this.canUseDevLogFallback()) {
      this.logger.warn(
        [
          'SMTP_URL / SMTP_FROM ausentes; envio real desativado.',
          `Password reset preview for ${payload.email}:`,
          payload.resetUrl,
        ].join('\n'),
      );
      return;
    }

    throw new Error('Password reset mail transport is unavailable.');
  }

  private isSmtpReady(): boolean {
    return Boolean(
      this.transporter && this.config.get<string>('SMTP_FROM')?.trim(),
    );
  }

  private canUseDevLogFallback(): boolean {
    const flag = this.config.get<string>('AUTH_RESET_DEV_LOG_ONLY');
    if (flag === 'false') return false;
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  private subject(locale: ResetMailPayload['locale']): string {
    return locale === 'en'
      ? 'PRONUXFIN password reset'
      : 'PRONUXFIN · redefinição de senha';
  }

  private textBody(payload: ResetMailPayload): string {
    if (payload.locale === 'en') {
      return [
        'PRONUXFIN password reset',
        '',
        `Use the secure link below to set a new password. It expires in ${payload.expiresMinutes} minutes.`,
        payload.resetUrl,
        '',
        'If you did not request this change, you can safely ignore this message.',
      ].join('\n');
    }

    return [
      'PRONUXFIN · redefinição de senha',
      '',
      `Use o link seguro abaixo para definir uma nova senha. Ele expira em ${payload.expiresMinutes} minutos.`,
      payload.resetUrl,
      '',
      'Se você não solicitou essa alteração, basta ignorar esta mensagem.',
    ].join('\n');
  }

  private htmlBody(payload: ResetMailPayload): string {
    const copy =
      payload.locale === 'en'
        ? {
            title: 'Password reset',
            lead: `Use the secure button below to set a new password. This link expires in ${payload.expiresMinutes} minutes.`,
            cta: 'Reset password',
            foot: 'If you did not request this change, you can ignore this email.',
          }
        : {
            title: 'Redefinição de senha',
            lead: `Use o botão seguro abaixo para definir uma nova senha. Este link expira em ${payload.expiresMinutes} minutos.`,
            cta: 'Redefinir senha',
            foot: 'Se você não solicitou essa alteração, pode ignorar este e-mail.',
          };

    return `
      <div style="background:#09111f;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#e5eefb;">
        <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));">
          <div style="padding:28px 28px 20px;">
            <div style="display:inline-block;padding:6px 10px;border-radius:999px;border:1px solid rgba(97,163,255,0.28);background:rgba(97,163,255,0.12);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8fc2ff;">
              PRONUXFIN
            </div>
            <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.15;color:#ffffff;">${copy.title}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#aab7cb;">${copy.lead}</p>
            <a href="${payload.resetUrl}" style="display:inline-block;padding:13px 18px;border-radius:14px;background:#56a0ff;color:#04111f;text-decoration:none;font-weight:700;">
              ${copy.cta}
            </a>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#8b9ab0;">
              ${copy.foot}
            </p>
            <p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:#70829d;word-break:break-all;">
              ${payload.resetUrl}
            </p>
          </div>
        </div>
      </div>
    `;
  }
}
