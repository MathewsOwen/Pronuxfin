import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { AuthMailerService } from './auth-mailer.service';
import type { JwtPayload } from './jwt.strategy';
import { resolveJwtExpiresSec } from './jwt-config.util';
import {
  hashPassword,
  verifyPassword,
  verifyPasswordDummy,
} from './password-hash.util';
import { RefreshTokenService, type TokenMeta } from './refresh-token.service';
import { SecurityEventService } from './security-event.service';
import { WebAuthnService } from './webauthn.service';
import { LoginLockoutService } from './login-lockout.service';
import {
  passwordPolicyMessage,
  validatePasswordPolicy,
} from './password-policy.util';
import { isPasswordBreached } from './password-breach-check.util';
import { isPlatformAdminIpAllowed } from './platform-admin-ip.util';
import { rolesForEmail } from './platform-admin.util';

const DEFAULT_RESET_TTL_MIN = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: AuthMailerService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly securityEvents: SecurityEventService,
    private readonly webauthn: WebAuthnService,
    private readonly loginLockout: LoginLockoutService,
  ) {}

  /**
   * Registration is intentionally non-enumerable: it always returns the same
   * generic `{ ok: true, pending: true }` whether or not the email already
   * exists, and never auto-logs-in (auto-login would itself reveal success).
   * Existing owners get a heads-up email instead. The user signs in afterwards.
   */
  async register(
    email: string,
    password: string,
    name: string,
    locale: 'pt-BR' | 'en' = 'pt-BR',
  ) {
    const policy = validatePasswordPolicy(password);
    if (!policy.ok) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: passwordPolicyMessage(policy.code),
          code: policy.code,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (await isPasswordBreached(password)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'This password appeared in a data breach. Choose a different password.',
          code: 'PASSWORD_BREACH_BLOCKED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.users.findByEmail(email);
    if (existing) {
      try {
        await this.mailer.sendAccountExistsEmail({
          email: existing.email,
          locale,
          loginUrl: this.buildLoginUrl(),
        });
      } catch {
        /* best-effort notice — never reveal via an error */
      }
      return { ok: true, pending: true };
    }

    const passwordHash = await hashPassword(password);
    try {
      await this.users.create({
        email,
        passwordHash,
        name: name.trim(),
      });
    } catch (e) {
      // Lost a race to a concurrent signup with the same email → still respond
      // generically so the outcome is indistinguishable.
      if (
        !(
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        )
      ) {
        throw e;
      }
    }
    return { ok: true, pending: true };
  }

  async login(
    email: string,
    password: string,
    meta?: TokenMeta,
    locale: 'pt-BR' | 'en' = 'pt-BR',
  ) {
    const user = await this.users.findByEmail(email);
    await this.loginLockout.assertLoginAllowed(email, user?.id ?? null, meta);

    if (!user) {
      await verifyPasswordDummy(password);
      await this.securityEvents.record('LOGIN_FAILED', null, meta);
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password.',
          code: 'AUTH_INVALID_CREDENTIALS',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const verified = await verifyPassword(password, user.passwordHash);
    if (!verified.ok) {
      await this.securityEvents.record('LOGIN_FAILED', user.id, meta);
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password.',
          code: 'AUTH_INVALID_CREDENTIALS',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (verified.needsUpgrade) {
      await this.users.updatePasswordHash(
        user.id,
        await hashPassword(password),
      );
    }

    const passkeyCount = await this.webauthn.credentialCount(user.id);
    if (passkeyCount > 0) {
      const challenge = await this.webauthn.createLoginChallenge(user.id);
      return {
        ok: true,
        webauthnRequired: true,
        challengeId: challenge.challengeId,
        expiresIn: challenge.expiresIn,
      };
    }

    return this.completeLogin(user, meta, locale);
  }

  async webauthnLoginOptions(challengeId: string) {
    const options = await this.webauthn.authenticationOptions(challengeId);
    return { ok: true, options };
  }

  async webauthnLoginVerify(
    challengeId: string,
    response: import('@simplewebauthn/server').AuthenticationResponseJSON,
    meta?: TokenMeta,
    locale: 'pt-BR' | 'en' = 'pt-BR',
  ) {
    const { userId } = await this.webauthn.verifyLogin(
      challengeId,
      response,
      meta,
    );
    const user = await this.users.findById(userId);
    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_SESSION_INVALID',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.completeLogin(user, meta, locale);
  }

  async refresh(rawToken: string, meta?: TokenMeta) {
    const rotated = await this.refreshTokens.rotate(rawToken, meta);
    if (!rotated) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_REFRESH_INVALID',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.users.findById(rotated.userId);
    if (!user) {
      await this.refreshTokens.revokeFamily(rotated.familyId);
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_REFRESH_INVALID',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const expires_in = resolveJwtExpiresSec(
      this.config.get<string | number>('JWT_EXPIRES_SEC'),
    );
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      ver: user.tokenVersion,
    };
    const access_token = this.jwt.sign(payload, { expiresIn: expires_in });
    return {
      access_token,
      refresh_token: rotated.token,
      token_type: 'Bearer',
      expires_in,
      refresh_expires_in: this.refreshTokens.ttlSec(),
    };
  }

  /** Smart logout: revoke just the presented refresh token (this device). */
  async logout(rawToken?: string, meta?: TokenMeta) {
    if (rawToken) {
      await this.refreshTokens.revoke(rawToken);
    }
    await this.securityEvents.record('LOGOUT', null, meta);
    return { ok: true };
  }

  /** Revoke every session for the user (logout everywhere). */
  async logoutAll(userId: string, meta?: TokenMeta) {
    await this.users.bumpTokenVersion(userId);
    await this.refreshTokens.revokeAllForUser(userId);
    await this.securityEvents.record('LOGOUT_ALL', userId, meta);
    return { ok: true };
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

    // Token já persistido — SMTP em background (cold start Render + Brevo não bloqueia a API).
    void this.mailer
      .sendPasswordResetEmail({
        email: user.email,
        locale,
        expiresMinutes,
        resetUrl: this.buildPasswordResetUrl(rawToken),
      })
      .catch(() => {
        /* best-effort; o utilizador pode pedir novo link se o e-mail falhar */
      });

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

    const policy = validatePasswordPolicy(password);
    if (!policy.ok) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: passwordPolicyMessage(policy.code),
          code: policy.code,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (await isPasswordBreached(password)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'This password appeared in a data breach. Choose a different password.',
          code: 'PASSWORD_BREACH_BLOCKED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await hashPassword(password);
    try {
      await this.users.consumePasswordResetToken({
        tokenId: lookup.id,
        userId: lookup.userId,
        passwordHash,
      });
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid password reset token.',
          code: 'AUTH_PASSWORD_RESET_INVALID',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Defense in depth: kill any refresh tokens an attacker may hold. The
    // tokenVersion bump (inside consumePasswordResetToken) already invalidates
    // access tokens.
    await this.refreshTokens.revokeAllForUser(lookup.userId);
    await this.securityEvents.record('PASSWORD_RESET', lookup.userId, {});

    return { ok: true };
  }

  private async completeLogin(
    user: { id: string; email: string; tokenVersion: number },
    meta?: TokenMeta,
    locale: 'pt-BR' | 'en' = 'pt-BR',
  ) {
    const isAdmin = rolesForEmail(user.email, this.config).length > 0;
    if (isAdmin && !isPlatformAdminIpAllowed(meta?.ip ?? null, this.config)) {
      await this.securityEvents.record('ADMIN_IP_DENIED', user.id, meta);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Admin sign-in is not allowed from this network.',
          code: 'AUTH_ADMIN_IP_FORBIDDEN',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    await this.securityEvents.record('LOGIN_SUCCESS', user.id, meta);
    await this.maybeNotifyNewLogin(user, meta, locale);
    return this.issueTokens(user, meta);
  }

  private async maybeNotifyNewLogin(
    user: { id: string; email: string },
    meta: TokenMeta | undefined,
    locale: 'pt-BR' | 'en',
  ) {
    const ip = meta?.ip ?? null;
    const userAgent = meta?.userAgent ?? null;
    const known = await this.securityEvents.hadRecentLoginFromDevice(
      user.id,
      ip,
      userAgent,
    );
    if (known) return;

    await this.securityEvents.record('LOGIN_NEW_DEVICE', user.id, meta);
    try {
      await this.mailer.sendNewLoginAlert({
        email: user.email,
        locale,
        ip,
        userAgent,
        sessionsUrl: `${this.frontendOrigin()}/perfil`,
      });
    } catch {
      /* best-effort */
    }
  }

  private async issueTokens(
    user: { id: string; email: string; tokenVersion: number },
    meta?: TokenMeta,
  ) {
    const expires_in = resolveJwtExpiresSec(
      this.config.get<string | number>('JWT_EXPIRES_SEC'),
    );
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      ver: user.tokenVersion,
    };
    const access_token = this.jwt.sign(payload, { expiresIn: expires_in });
    const refresh = await this.refreshTokens.issue(user.id, { meta });
    return {
      access_token,
      refresh_token: refresh.token,
      token_type: 'Bearer',
      expires_in,
      refresh_expires_in: this.refreshTokens.ttlSec(),
    };
  }

  private passwordResetTtlMinutes(): number {
    const raw = Number(
      this.config.get('AUTH_RESET_TOKEN_TTL_MIN') ?? DEFAULT_RESET_TTL_MIN,
    );
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RESET_TTL_MIN;
  }

  private frontendOrigin(): string {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    return frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
  }

  private buildPasswordResetUrl(token: string): string {
    return `${this.frontendOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private buildLoginUrl(): string {
    return `${this.frontendOrigin()}/login`;
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
