/**
 * Rate limit em memória por chave (adequado a instância única ou dev).
 * Produção multi-réplica deve usar Redis / edge limiter.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 4000;

/** Permite até `max` pedidos por janela `windowMs`. */
export function allowWithinWindow(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  if (buckets.size > MAX_KEYS && Math.random() < 0.02) {
    for (const [k, b] of buckets) {
      if (now > b.resetAt + windowMs) buckets.delete(k);
    }
  }

  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}
