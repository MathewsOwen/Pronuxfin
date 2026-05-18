/**
 * URL pública do site (SEO, OG, readiness).
 * Preferência: NEXT_PUBLIC_SITE_URL → host Vercel → localhost.
 */
export function resolvePublicSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      return explicit.replace(/\/+$/, "");
    }
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

/** Prontidão: explícito ou inferível em deploy Vercel. */
export function hasPublicSiteUrlConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return true;
  return Boolean(
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
      process.env.VERCEL_URL?.trim(),
  );
}

export function publicSiteUrlReadinessDetail(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return "configured";
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return "inferred from VERCEL_PROJECT_PRODUCTION_URL";
  }
  if (process.env.VERCEL_URL?.trim()) return "inferred from VERCEL_URL";
  return "missing NEXT_PUBLIC_SITE_URL";
}
