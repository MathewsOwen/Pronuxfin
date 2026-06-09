import { NextResponse } from "next/server";

/** Baseline headers for JSON API responses (defence in depth with next.config). */
export function applyApiSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-site");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  return res;
}

/** Apply security headers to a pass-through API response from proxy/middleware. */
export function withApiSecurityHeaders(res: NextResponse): NextResponse {
  return applyApiSecurityHeaders(res);
}
