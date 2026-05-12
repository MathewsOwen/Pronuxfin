import { acceptLanguagePrefersPortuguese } from './accept-language.util';

describe('acceptLanguagePrefersPortuguese', () => {
  it('returns false for missing or empty header', () => {
    expect(acceptLanguagePrefersPortuguese(undefined)).toBe(false);
    expect(acceptLanguagePrefersPortuguese('')).toBe(false);
    expect(acceptLanguagePrefersPortuguese('   ')).toBe(false);
  });

  it('returns true when primary tag is Portuguese', () => {
    expect(acceptLanguagePrefersPortuguese('pt-BR')).toBe(true);
    expect(acceptLanguagePrefersPortuguese('pt')).toBe(true);
    expect(acceptLanguagePrefersPortuguese('pt-PT;q=1.0')).toBe(true);
  });

  it('returns false when primary tag is not Portuguese', () => {
    expect(acceptLanguagePrefersPortuguese('en-US')).toBe(false);
    expect(acceptLanguagePrefersPortuguese('en-US, pt-BR;q=0.9')).toBe(false);
  });

  it('trims whitespace and ignores weights on first tag', () => {
    expect(acceptLanguagePrefersPortuguese(' pt-br , en;q=0.8')).toBe(true);
  });
});
