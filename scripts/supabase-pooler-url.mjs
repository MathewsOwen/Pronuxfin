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
