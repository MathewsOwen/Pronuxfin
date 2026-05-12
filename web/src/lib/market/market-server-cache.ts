type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const valueCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export async function rememberWithTtl<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const cached = valueCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const current = inFlight.get(key);
  if (current) {
    return (await current) as T;
  }

  const next = loader()
    .then((value) => {
      valueCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, next);
  return (await next) as T;
}
