type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const valueCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

type RememberWithTtlOptions<T> = {
  /** TTL curto quando `shouldRetain` devolve false (ex.: notícias vazias). */
  shortTtlMs?: number;
  shouldRetain?: (value: T) => boolean;
};

export async function rememberWithTtl<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  options?: RememberWithTtlOptions<T>,
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

  const shortTtlMs = options?.shortTtlMs ?? 45_000;
  const shouldRetain = options?.shouldRetain ?? (() => true);

  const next = loader()
    .then((value) => {
      const retain = shouldRetain(value);
      valueCache.set(key, {
        value,
        expiresAt: Date.now() + (retain ? ttlMs : shortTtlMs),
      });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, next);
  return (await next) as T;
}
