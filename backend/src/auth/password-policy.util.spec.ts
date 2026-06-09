import { validatePasswordPolicy } from './password-policy.util';

describe('password-policy', () => {
  it('accepts strong passwords', () => {
    expect(validatePasswordPolicy('MyStr0ng!Pass')).toEqual({ ok: true });
  });

  it('rejects short passwords', () => {
    expect(validatePasswordPolicy('Short1!')).toEqual({
      ok: false,
      code: 'PASSWORD_TOO_SHORT',
    });
  });

  it('rejects weak class mix', () => {
    expect(validatePasswordPolicy('alllowercaseonly')).toEqual({
      ok: false,
      code: 'PASSWORD_TOO_WEAK',
    });
  });

  it('rejects common passwords', () => {
    expect(validatePasswordPolicy('password1234')).toEqual({
      ok: false,
      code: 'PASSWORD_COMMON',
    });
  });
});
