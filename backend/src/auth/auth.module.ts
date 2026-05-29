import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthMailerService } from './auth-mailer.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { buildJwtModuleConfig } from './jwt-crypto.util';
import { JwtStrategy } from './jwt.strategy';
import { RefreshTokenService } from './refresh-token.service';
import { InternalApiGuard } from './internal-api.guard';
import { SecurityEventService } from './security-event.service';
import { WebAuthnService } from './webauthn.service';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const built = buildJwtModuleConfig(config);
        if (built.algorithm === 'RS256') {
          return {
            privateKey: built.privateKey,
            publicKey: built.publicKey,
            signOptions: built.signOptions,
          };
        }
        return {
          secret: built.secret,
          signOptions: built.signOptions,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthMailerService,
    JwtStrategy,
    RefreshTokenService,
    SecurityEventService,
    WebAuthnService,
    InternalApiGuard,
  ],
  exports: [AuthService, AuthMailerService],
})
export class AuthModule {}
