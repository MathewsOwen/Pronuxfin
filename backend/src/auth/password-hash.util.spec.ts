import * as bcrypt from 'bcryptjs';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  isArgon2Hash,
  verifyPassword,
  verifyPasswordDummy,
} from './password-hash.util';

describe('password-hash.util', () => {
  it('hashes with Argon2id', async () => {
    const hash = await hashPassword('test-password-123');
    expect(isArgon2Hash(hash)).toBe(true);
    const result = await verifyPassword('test-password-123', hash);
    expect(result.ok).toBe(true);
    expect(result.needsUpgrade).toBe(false);
  });

  it('upgrades bcrypt on successful verify', async () => {
    const bcryptHash = await bcrypt.hash('legacy-pass', 12);
    const result = await verifyPassword('legacy-pass', bcryptHash);
    expect(result.ok).toBe(true);
    expect(result.needsUpgrade).toBe(true);
  });

  it('dummy verify uses argon2 hash', async () => {
    await expect(verifyPasswordDummy('wrong')).resolves.toBeUndefined();
    expect(DUMMY_PASSWORD_HASH.startsWith('$argon2')).toBe(true);
  });
});
