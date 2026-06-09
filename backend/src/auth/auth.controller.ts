import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { WebAuthnLoginOptionsDto } from './dto/webauthn-login-options.dto';
import { WebAuthnLoginVerifyDto } from './dto/webauthn-login-verify.dto';
import { WebAuthnRegisterVerifyDto } from './dto/webauthn-register-verify.dto';
import { WebAuthnRemoveDto } from './dto/webauthn-remove.dto';
import { WebAuthnService } from './webauthn.service';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { PLATFORM_ADMIN_ROLE } from './platform-admin.util';
import type { TokenMeta } from './refresh-token.service';

function requestMeta(req: Request): TokenMeta {
  const ua = req.headers['user-agent'];
  return {
    userAgent: typeof ua === 'string' ? ua : null,
    ip: req.ip ?? null,
  };
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly webauthn: WebAuthnService,
  ) {}

  /** Alinhado ao rate limit da rota Next `/api/auth/register` (15 / 5 min). */
  @Throttle({ default: { limit: 15, ttl: 300_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.name, dto.locale);
  }

  /** Alinhado ao rate limit da rota Next `/api/auth/login` (25 / min). */
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(
      dto.email,
      dto.password,
      requestMeta(req),
      dto.locale ?? 'pt-BR',
    );
  }

  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @Post('webauthn/login/options')
  webauthnLoginOptions(@Body() dto: WebAuthnLoginOptionsDto) {
    return this.auth.webauthnLoginOptions(dto.challengeId);
  }

  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @Post('webauthn/login/verify')
  webauthnLoginVerify(
    @Body() dto: WebAuthnLoginVerifyDto,
    @Req() req: Request,
  ) {
    return this.auth.webauthnLoginVerify(
      dto.challengeId,
      dto.response as never,
      requestMeta(req),
      dto.locale ?? 'pt-BR',
    );
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('webauthn/register/options')
  @UseGuards(AuthGuard('jwt'))
  async webauthnRegisterOptions(@CurrentUser() user: RequestUser) {
    const record = await this.users.findById(user.userId);
    if (!record) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session invalid.',
          code: 'AUTH_SESSION_INVALID',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.webauthn.registrationOptions(user.userId, record.email);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('webauthn/register/verify')
  @UseGuards(AuthGuard('jwt'))
  webauthnRegisterVerify(
    @CurrentUser() user: RequestUser,
    @Body() dto: WebAuthnRegisterVerifyDto,
    @Req() req: Request,
  ) {
    return this.webauthn.verifyRegistration(
      user.userId,
      dto.challengeId,
      dto.response as never,
      dto.friendlyName,
      requestMeta(req),
    );
  }

  @Post('webauthn/list')
  @UseGuards(AuthGuard('jwt'))
  webauthnList(@CurrentUser() user: RequestUser) {
    return this.webauthn.listCredentials(user.userId);
  }

  @Post('webauthn/remove')
  @UseGuards(AuthGuard('jwt'))
  webauthnRemove(
    @CurrentUser() user: RequestUser,
    @Body() dto: WebAuthnRemoveDto,
  ) {
    return this.webauthn.removeCredential(user.userId, dto.credentialId);
  }

  /** Rotaciona o refresh token e emite um novo par access/refresh. */
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, requestMeta(req));
  }

  /** Logout deste dispositivo: revoga o refresh token apresentado. */
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('logout')
  logout(@Body() dto: LogoutDto, @Req() req: Request) {
    return this.auth.logout(dto.refreshToken, requestMeta(req));
  }

  /** Logout em todos os dispositivos: revoga todas as sessões do utilizador. */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  logoutAll(@CurrentUser() user: RequestUser, @Req() req: Request) {
    return this.auth.logoutAll(user.userId, requestMeta(req));
  }

  /** Recuperação de acesso: sempre resposta genérica para não expor existência do e-mail. */
  @Throttle({ default: { limit: 8, ttl: 300_000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(dto.email, dto.locale);
  }

  /** Reset com token curto, hash server-side e expiração. */
  @Throttle({ default: { limit: 12, ttl: 300_000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: RequestUser) {
    const record = await this.users.findById(user.userId);
    if (!record) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session invalid.',
          code: 'AUTH_SESSION_INVALID',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return {
      id: record.id,
      email: record.email,
      name: record.name ?? null,
      isAdmin: user.roles.includes(PLATFORM_ADMIN_ROLE),
    };
  }
}
