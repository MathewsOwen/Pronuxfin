import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

/** Tamanho máx. aceite — protege contra POST volumoso. */
const MAX_BYTES = 100_000;

/**
 * Aceita relatórios de violação CSP (JSON).
 * Saida vai para stdout (Vercel / Node) onde o relatório aparece concatenado aos logs estruturados.
 */
export async function POST(req: Request): Promise<Response> {
  const limited = await rateLimitResponse("csp-report", 30, 60_000);
  if (limited) return limited;

  const len = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(len) && len > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = raw.length ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  console.log(
    `${JSON.stringify({
      level: "warn",
      msg: "csp_report",
      service: "pronuxfin-web",
      detail: parsed,
    })}`,
  );

  return new NextResponse(null, { status: 204 });
}
