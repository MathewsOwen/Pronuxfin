import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { AuthMailerService } from './auth-mailer.service';
import type { JwtPayload } from './jwt.strategy';

const SALT_ROUNDS = 12;
const DEFAULT_RESET_TTL_MIN = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: AuthMailerService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: 'This email is already registered.',
          code: 'AUTH_EMAIL_IN_USE',
        },
        HttpStatus.CONFLICT,
      );
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.users.create({ email, passwordHash, name });
    return this.issueTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password.',
          code: 'AUTH_INVALID_CREDENTIALS',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password.',
          code: 'AUTH_INVALID_CREDENTIALS',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.issueTokens(user.id, user.email);
  }

  async requestPasswordReset(email: string, locale: 'pt-BR' | 'en' = 'pt-BR') {
    this.assertPasswordResetAvailable();

    const user = await this.users.findByEmail(email.trim());
    if (!user) {
      return { ok: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresMinutes = this.passwordResetTtlMinutes();
    const expiresAt = new Date(Date.now() + expiresMinutes * 60_000);
    await this.users.replacePasswordResetToken({
      userId: user.id,
      tokenHash: hashPasswordResetToken(rawToken),
      expiresAt,
    });

    try {
      await this.mailer.sendPasswordResetEmail({
        email: user.email,
        locale,
        expiresMinutes,
        resetUrl: this.buildPasswordResetUrl(rawToken),
      });
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Password reset delivery is temporarily unavailable.',
          code: 'AUTH_PASSWORD_RESET_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const lookup = await this.users.findPasswordResetTokenByHash(
      hashPasswordResetToken(token.trim()),
    );

    if (!lookup || lookup.usedAt) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid password reset token.',
          code: 'AUTH_PASSWORD_RESET_INVALID',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (lookup.expiresAt.getTime() <= Date.now()) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Password reset token expired.',
          code: 'AUTH_PASSWORD_RESET_EXPIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await this.users.consumePasswordResetToken({
      tokenId: lookup.id,
      userId: lookup.userId,
      passwordHash,
    });

    return { ok: true };
  }

  private issueTokens(sub: string, email: string) {
    const payload: JwtPayload = { sub, email };
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
      token_type: 'Bearer',
      expires_in: null as number | null,
    };
  }

  private passwordResetTtlMinutes(): number {
    const raw = Number(
      this.config.get('AUTH_RESET_TOKEN_TTL_MIN') ?? DEFAULT_RESET_TTL_MIN,
    );
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RESET_TTL_MIN;
  }

  private buildPasswordResetUrl(token: string): string {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const origin = frontendUrl.endsWith('/')
      ? frontendUrl.slice(0, -1)
      : frontendUrl;
    return `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private assertPasswordResetAvailable() {
    if (this.mailer.canSendPasswordReset()) return;
    throw new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Password reset delivery is not configured on this server.',
        code: 'AUTH_PASSWORD_RESET_UNAVAILABLE',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
