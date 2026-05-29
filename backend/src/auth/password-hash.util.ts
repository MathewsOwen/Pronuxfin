import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

const ARGON2_OPTIONS: argon2.Options & { type: typeof argon2.argon2id } = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 4,
};

/** Fixed Argon2id hash — used for constant-time login when the email is unknown. */
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$PhOOKSWDsIWZg0ldrz6ebw$KkxSrbHm86ADq1vMNiT6p8d4FYTXJfIynMCr6vhuR5w';

export function isArgon2Hash(stored: string): boolean {
  return stored.startsWith('$argon2');
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export type PasswordVerifyResult = {
  ok: boolean;
  /** True when a legacy bcrypt hash matched and should be re-hashed to Argon2id. */
  needsUpgrade: boolean;
};

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<PasswordVerifyResult> {
  if (isArgon2Hash(stored)) {
    try {
      const ok = await argon2.verify(stored, password);
      return { ok, needsUpgrade: false };
    } catch {
      return { ok: false, needsUpgrade: false };
    }
  }

  const ok = await bcrypt.compare(password, stored);
  return { ok, needsUpgrade: ok };
}

/** Constant-time path when the account does not exist. */
export async function verifyPasswordDummy(password: string): Promise<void> {
  await argon2.verify(DUMMY_PASSWORD_HASH, password).catch(() => undefined);
}
