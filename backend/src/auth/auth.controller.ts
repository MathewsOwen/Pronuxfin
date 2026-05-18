import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { PLATFORM_ADMIN_ROLE } from './platform-admin.util';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  /** Alinhado ao rate limit da rota Next `/api/auth/register` (15 / 5 min). */
  @Throttle({ default: { limit: 15, ttl: 300_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.name);
  }

  /** Alinhado ao rate limit da rota Next `/api/auth/login` (25 / min). */
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
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

  @SkipThrottle()
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: RequestUser) {
    const record = await this.users.findById(user.userId);
    return {
      id: user.userId,
      email: user.email,
      name: record?.name ?? null,
      isAdmin: user.roles.includes(PLATFORM_ADMIN_ROLE),
    };
  }
}
