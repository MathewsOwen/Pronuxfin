const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1234',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'pronuxfin',
  'magiluka',
]);

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; code: 'PASSWORD_TOO_SHORT' | 'PASSWORD_TOO_WEAK' | 'PASSWORD_COMMON' };

/** Enterprise password rules for register / reset (not login). */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (password.length < 12) {
    return { ok: false, code: 'PASSWORD_TOO_SHORT' };
  }
  if (password.length > 256) {
    return { ok: false, code: 'PASSWORD_TOO_SHORT' };
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return { ok: false, code: 'PASSWORD_COMMON' };
  }

  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (classes < 3) {
    return { ok: false, code: 'PASSWORD_TOO_WEAK' };
  }

  return { ok: true };
}

export function passwordPolicyMessage(
  code: 'PASSWORD_TOO_SHORT' | 'PASSWORD_TOO_WEAK' | 'PASSWORD_COMMON',
): string {
  switch (code) {
    case 'PASSWORD_TOO_SHORT':
      return 'Password must be at least 12 characters.';
    case 'PASSWORD_TOO_WEAK':
      return 'Password must include at least 3 of: lowercase, uppercase, number, symbol.';
    case 'PASSWORD_COMMON':
      return 'Password is too common. Choose a stronger password.';
    default:
      return 'Invalid password.';
  }
}
