import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { rolesForEmail } from './platform-admin.util';

/** `roles` opcional para tokens antigos; allowlist em env aplica-se sempre ao e-mail. */
export type JwtPayload = { sub: string; email: string; roles?: string[] };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    const roles = rolesForEmail(payload.email, this.config);
    return { userId: payload.sub, email: payload.email, roles };
  }
}
