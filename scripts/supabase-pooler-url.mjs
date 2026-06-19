/**
 * Converte connection string Supabase direct (5432) → pooler (6543) para Vercel/serverless.
 * @param {string} directUrl
 * @param {{ poolerHost?: string }} [opts]
 * @returns {string | null}
 */
export function supabaseDirectToPoolerUrl(directUrl, opts = {}) {
  const raw = directUrl?.trim();
  if (!raw) return null;

  try {
    const u = new URL(raw.replace(/^postgresql:\/\//, "http://"));
    const host = u.hostname.toLowerCase();
    const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (!m) return null;

    const projectRef = m[1];
    const password = decodeURIComponent(u.password);
    const database = u.pathname.replace(/^\//, "") || "postgres";
    const poolerHost =
      opts.poolerHost?.trim() ||
      process.env.SUPABASE_POOLER_HOST?.trim() ||
      "aws-1-us-east-1.pooler.supabase.com";

    const params = new URLSearchParams(u.search);
    params.set("pgbouncer", "true");
    if (!params.has("sslmode")) params.set("sslmode", "require");

    const user = `postgres.${projectRef}`;
    const qs = params.toString();
    return `postgresql://${user}:${encodeURIComponent(password)}@${poolerHost}:6543/${database}?${qs}`;
  } catch {
    return null;
  }
}

/** True when the URL targets Supabase transaction pooler (unsuitable for Prisma migrate). */
export function isSupabasePoolerUrl(url) {
  const raw = url?.trim() ?? "";
  return /pooler\.supabase\.com:6543/i.test(raw) || /[?&]pgbouncer=true/i.test(raw);
}

/**
 * Converte pooler transaction (6543) → session pooler (5432) para `prisma migrate deploy`.
 * A Vercel não alcança `db.*.supabase.co`; o session pooler no mesmo host funciona.
 * @param {string} poolerUrl
 * @returns {string | null}
 */
export function supabasePoolerToSessionMigrateUrl(poolerUrl) {
  const raw = poolerUrl?.trim();
  if (!raw) return null;

  try {
    const u = new URL(raw.replace(/^postgresql:\/\//, "http://"));
    if (!/pooler\.supabase\.com$/i.test(u.hostname)) return null;
    if (!/^postgres\.[a-z0-9]+$/i.test(u.username)) return null;

    const password = u.password;
    const database = u.pathname.replace(/^\//, "") || "postgres";
    const params = new URLSearchParams(u.search);
    params.delete("pgbouncer");
    if (!params.has("sslmode")) params.set("sslmode", "require");
    const qs = params.toString();
    return `postgresql://${u.username}:${password}@${u.hostname}:5432/${database}?${qs}`;
  } catch {
    return null;
  }
}

/**
 * Converte pooler (6543) → URI directa `db.*.supabase.co:5432` (local/CI com rede estável).
 * @param {string} poolerUrl
 * @returns {string | null}
 */
export function supabasePoolerToDirectUrl(poolerUrl) {
  const raw = poolerUrl?.trim();
  if (!raw) return null;

  try {
    const u = new URL(raw.replace(/^postgresql:\/\//, "http://"));
    const userMatch = u.username.match(/^postgres\.([a-z0-9]+)$/i);
    if (!userMatch) return null;

    const projectRef = userMatch[1];
    const password = encodeURIComponent(decodeURIComponent(u.password));
    const database = u.pathname.replace(/^\//, "") || "postgres";
    const params = new URLSearchParams(u.search);
    params.delete("pgbouncer");
    if (!params.has("sslmode")) params.set("sslmode", "require");
    const qs = params.toString();
    return `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/${database}?${qs}`;
  } catch {
    return null;
  }
}
