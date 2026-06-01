import type { ConfigService } from '@nestjs/config';
import { resolveJwtExpiresSec } from './jwt-config.util';

export type JwtAlgorithm = 'HS256' | 'RS256';

export function resolveJwtAlgorithm(
  config: ConfigService | { get: (key: string) => string | undefined },
): JwtAlgorithm {
  const value: unknown = config.get('JWT_ALGORITHM');
  const raw =
    typeof value === 'string' ? value.trim().toUpperCase() : undefined;
  return raw === 'RS256' ? 'RS256' : 'HS256';
}

export function normalizePemMultiline(value: string): string {
  return value.replace(/\\n/g, '\n').trim();
}

export function jwtExpiresSec(config: ConfigService): number {
  return resolveJwtExpiresSec(config.get<string | number>('JWT_EXPIRES_SEC'));
}

export type JwtModuleKeyConfig =
  | {
      algorithm: 'HS256';
      secret: string;
      signOptions: { algorithm: 'HS256'; expiresIn: number };
    }
  | {
      algorithm: 'RS256';
      privateKey: string;
      publicKey: string;
      signOptions: { algorithm: 'RS256'; expiresIn: number };
    };

export function buildJwtModuleConfig(
  config: ConfigService,
): JwtModuleKeyConfig {
  const expiresIn = jwtExpiresSec(config);
  const algorithm = resolveJwtAlgorithm(config);

  if (algorithm === 'RS256') {
    const privateKey = normalizePemMultiline(
      config.getOrThrow<string>('JWT_PRIVATE_KEY'),
    );
    const publicKey = normalizePemMultiline(
      config.getOrThrow<string>('JWT_PUBLIC_KEY'),
    );
    return {
      algorithm: 'RS256',
      privateKey,
      publicKey,
      signOptions: { algorithm: 'RS256', expiresIn },
    };
  }

  return {
    algorithm: 'HS256',
    secret: config.getOrThrow<string>('JWT_SECRET'),
    signOptions: { algorithm: 'HS256', expiresIn },
  };
}

export function jwtStrategyVerifyKey(config: ConfigService): string {
  const built = buildJwtModuleConfig(config);
  return built.algorithm === 'RS256' ? built.publicKey : built.secret;
}
