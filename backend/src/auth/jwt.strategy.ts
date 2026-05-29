import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { jwtStrategyVerifyKey, resolveJwtAlgorithm } from './jwt-crypto.util';
import { rolesForEmail } from './platform-admin.util';

export type JwtPayload = {
  sub: string;
  email: string;
  roles?: string[];
  /** Session epoch — must match User.tokenVersion or the token is revoked. */
  ver?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtStrategyVerifyKey(config),
      algorithms: [resolveJwtAlgorithm(config)],
    });
  }

  async validate(payload: JwtPayload) {
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    if (!sub || !email) {
      throw new UnauthorizedException();
    }

    const record = await this.users.findById(sub);
    if (!record) {
      throw new UnauthorizedException();
    }

    // Global revocation: a logout-all / password reset bumps tokenVersion,
    // instantly invalidating every access token minted before it.
    if ((payload.ver ?? 0) !== record.tokenVersion) {
      throw new UnauthorizedException();
    }

    const roles = rolesForEmail(record.email, this.config);
    return { userId: record.id, email: record.email, roles };
  }
}
