import { Injectable } from '@nestjs/common';
import { PasswordResetToken, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
      },
    });
  }

  /** Invalidates every access token previously issued for this user. */
  async bumpTokenVersion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  /** Transparent bcrypt → Argon2id upgrade after a successful login. */
  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async replacePasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: { userId: data.userId },
      });
      return tx.passwordResetToken.create({
        data: {
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
        },
      });
    });
  }

  async findPasswordResetTokenByHash(
    tokenHash: string,
  ): Promise<
    (PasswordResetToken & { user: Pick<User, 'id' | 'email'> }) | null
  > {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async consumePasswordResetToken(data: {
    tokenId: string;
    userId: string;
    passwordHash: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: data.tokenId, userId: data.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new Error('PASSWORD_RESET_TOKEN_CONSUMED');
      }
      await tx.user.update({
        where: { id: data.userId },
        // Resetting the password invalidates all existing sessions.
        data: {
          passwordHash: data.passwordHash,
          tokenVersion: { increment: 1 },
        },
      });
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: data.userId,
          NOT: { id: data.tokenId },
        },
      });
    });
  }
}
