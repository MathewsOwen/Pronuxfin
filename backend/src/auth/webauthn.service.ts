import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityEventService } from './security-event.service';
import { resolveWebAuthnConfig } from './webauthn-config.util';
import type { TokenMeta } from './refresh-token.service';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class WebAuthnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly securityEvents: SecurityEventService,
  ) {}

  private cfg() {
    return resolveWebAuthnConfig(this.config);
  }

  async credentialCount(userId: string): Promise<number> {
    return this.prisma.webAuthnCredential.count({ where: { userId } });
  }

  async createLoginChallenge(userId: string): Promise<{
    challengeId: string;
    expiresIn: number;
  }> {
    const { rpID } = this.cfg();
    const creds = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map((c) => ({
        id: c.credentialId,
        transports: parseTransports(c.transports),
      })),
      userVerification: 'preferred',
    });

    const row = await this.prisma.webAuthnChallenge.create({
      data: {
        userId,
        type: 'authentication',
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });

    return {
      challengeId: row.id,
      expiresIn: Math.floor(CHALLENGE_TTL_MS / 1000),
    };
  }

  async authenticationOptions(challengeId: string) {
    const row = await this.loadChallenge(challengeId, 'authentication');
    const { rpID } = this.cfg();
    const creds = await this.prisma.webAuthnCredential.findMany({
      where: { userId: row.userId },
      select: { credentialId: true, transports: true },
    });

    return generateAuthenticationOptions({
      rpID,
      challenge: row.challenge,
      allowCredentials: creds.map((c) => ({
        id: c.credentialId,
        transports: parseTransports(c.transports),
      })),
      userVerification: 'preferred',
    });
  }

  async verifyLogin(
    challengeId: string,
    response: AuthenticationResponseJSON,
    meta?: TokenMeta,
  ): Promise<{ userId: string }> {
    const row = await this.loadChallenge(challengeId, 'authentication');
    const stored = await this.prisma.webAuthnCredential.findUnique({
      where: { credentialId: response.id },
    });
    if (!stored || stored.userId !== row.userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Passkey verification failed.',
          code: 'WEBAUTHN_VERIFY_FAILED',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { origin, rpID } = this.cfg();
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: row.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: stored.credentialId,
          publicKey: stored.publicKey,
          counter: Number(stored.counter),
          transports: parseTransports(stored.transports),
        },
      });
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Passkey verification failed.',
          code: 'WEBAUTHN_VERIFY_FAILED',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.consumeChallenge(row.id);
    await this.prisma.webAuthnCredential.update({
      where: { id: stored.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    await this.securityEvents.record('WEBAUTHN_LOGIN_SUCCESS', row.userId, {
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { credentialId: stored.id },
    });

    return { userId: row.userId };
  }

  async registrationOptions(userId: string, email: string) {
    const { rpName, rpID } = this.cfg();
    const existing = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: email,
      userID: Buffer.from(userId, 'utf8'),
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: parseTransports(c.transports),
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const row = await this.prisma.webAuthnChallenge.create({
      data: {
        userId,
        type: 'registration',
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });

    return { options, challengeId: row.id };
  }

  async verifyRegistration(
    userId: string,
    challengeId: string,
    response: RegistrationResponseJSON,
    friendlyName?: string,
    meta?: TokenMeta,
  ) {
    const row = await this.prisma.webAuthnChallenge.findFirst({
      where: {
        id: challengeId,
        userId,
        type: 'registration',
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!row) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Registration challenge expired.',
          code: 'WEBAUTHN_CHALLENGE_EXPIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { origin, rpID } = this.cfg();
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: row.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Passkey registration failed.',
          code: 'WEBAUTHN_REGISTER_FAILED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const regInfo = verification.registrationInfo;
    if (!regInfo) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Passkey registration failed.',
          code: 'WEBAUTHN_REGISTER_FAILED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const { credential, credentialDeviceType, credentialBackedUp } = regInfo;
    await this.consumeChallenge(row.id);
    await this.prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports?.join(',') ?? null,
        friendlyName: friendlyName?.slice(0, 80) ?? null,
      },
    });

    await this.securityEvents.record('WEBAUTHN_REGISTERED', userId, {
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { ok: true };
  }

  async listCredentials(userId: string) {
    const rows = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        friendlyName: true,
        deviceType: true,
        backedUp: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      friendlyName: r.friendlyName,
      deviceType: r.deviceType,
      backedUp: r.backedUp,
      createdAt: r.createdAt.toISOString(),
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
    }));
  }

  async removeCredential(userId: string, credentialRowId: string) {
    const deleted = await this.prisma.webAuthnCredential.deleteMany({
      where: { id: credentialRowId, userId },
    });
    if (deleted.count !== 1) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Passkey not found.',
          code: 'WEBAUTHN_NOT_FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    await this.securityEvents.record('WEBAUTHN_REMOVED', userId, {
      metadata: { credentialRowId },
    });
    return { ok: true };
  }

  private async loadChallenge(id: string, type: string) {
    const row = await this.prisma.webAuthnChallenge.findUnique({
      where: { id },
    });
    if (
      !row ||
      row.type !== type ||
      row.consumedAt ||
      row.expiresAt.getTime() <= Date.now()
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Challenge expired or invalid.',
          code: 'WEBAUTHN_CHALLENGE_EXPIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return row;
  }

  private async consumeChallenge(id: string) {
    await this.prisma.webAuthnChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}

function parseTransports(
  raw: string | null,
): AuthenticatorTransport[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').filter(Boolean) as AuthenticatorTransport[];
}
