import { createHash } from 'crypto';

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range';
const DEFAULT_TIMEOUT_MS = 4_000;

function breachCheckEnabled(): boolean {
  if (process.env.PASSWORD_BREACH_CHECK === '0') return false;
  if (process.env.PASSWORD_BREACH_CHECK === '1') return true;
  return process.env.NODE_ENV === 'production';
}

/** k-anonymity breach check (Have I Been Pwned). Fail-open on network errors. */
export async function isPasswordBreached(password: string): Promise<boolean> {
  if (!breachCheckEnabled()) return false;

  const sha1 = createHash('sha1')
    .update(password, 'utf8')
    .digest('hex')
    .toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const timeoutMs = Number(process.env.PASSWORD_BREACH_CHECK_TIMEOUT_MS);
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_TIMEOUT_MS,
  );

  try {
    const res = await fetch(`${HIBP_RANGE_URL}/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'PRONUXFIN-Auth' },
      signal: controller.signal,
    });
    if (!res.ok) return false;

    const text = await res.text();
    return text.split('\n').some((line) => {
      const [hashSuffix] = line.trim().split(':');
      return hashSuffix === suffix;
    });
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
