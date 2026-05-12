/**
 * Preferência de português pelo primeiro código em `Accept-Language` (forma simples, alinhada aos browsers).
 */
export function acceptLanguagePrefersPortuguese(
  header: string | undefined,
): boolean {
  if (typeof header !== 'string' || !header.trim()) {
    return false;
  }
  const first = header
    .split(',')
    .map((part) => part.trim().split(';')[0]?.trim().toLowerCase() ?? '')
    .filter(Boolean)[0];
  return !!first && first.startsWith('pt');
}
