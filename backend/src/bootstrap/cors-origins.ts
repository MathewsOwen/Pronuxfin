/** Origens CORS permitidas — `FRONTEND_URL` + lista opcional `FRONTEND_URLS` (vírgula). */
export function resolveCorsOrigins(): string[] {
  const raw = [
    process.env.FRONTEND_URL?.trim() ?? '',
    ...(process.env.FRONTEND_URLS?.split(/[,;]+/) ?? []),
  ];

  const origins = new Set<string>();
  for (const entry of raw) {
    const value = entry.trim();
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      /* ignora entradas inválidas (ex.: host sem scheme) */
    }
  }

  if (origins.size === 0) {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  return [...origins];
}
