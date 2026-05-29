import { resolveJwtAlgorithm } from "@/lib/auth/jwt-crypto";

export type EnterpriseSecurityHint = {
  key: string;
  ok: boolean;
  detail: string;
  recommended: boolean;
};

/** Advisory checks for production hardening (does not block the app). */
export function evaluateEnterpriseSecurityHints(): EnterpriseSecurityHint[] {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  if (!isProd) return [];

  const hints: EnterpriseSecurityHint[] = [];

  const algo = resolveJwtAlgorithm();
  hints.push({
    key: "jwt_rs256",
    ok: algo === "RS256",
    detail: algo === "RS256" ? "RS256 active" : `JWT_ALGORITHM=${algo} (recommend RS256)`,
    recommended: true,
  });

  const strictBind = process.env.REFRESH_STRICT_BIND?.trim().toLowerCase();
  const bindOn =
    strictBind === "1" || strictBind === "true" || strictBind === "yes";
  hints.push({
    key: "refresh_strict_bind",
    ok: bindOn,
    detail: bindOn ? "REFRESH_STRICT_BIND enabled" : "REFRESH_STRICT_BIND off (recommend 1 on backend)",
    recommended: true,
  });

  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  hints.push({
    key: "internal_api_secret",
    ok: !!internalSecret && internalSecret.length >= 32,
    detail: internalSecret ? "INTERNAL_API_SECRET set" : "missing INTERNAL_API_SECRET",
    recommended: true,
  });

  const loginNotify = process.env.AUTH_LOGIN_NOTIFY !== "0";
  const smtp = !!process.env.SMTP_URL?.trim();
  hints.push({
    key: "login_notify",
    ok: loginNotify && smtp,
    detail:
      loginNotify && smtp ?
        "login alerts enabled"
      : "set SMTP_URL + AUTH_LOGIN_NOTIFY for new-device emails",
    recommended: false,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  const rpId = process.env.WEBAUTHN_RP_ID?.trim();
  const webauthnOrigin = process.env.WEBAUTHN_ORIGIN?.trim();
  const webauthnOk =
    !!rpId &&
    !!webauthnOrigin &&
    !webauthnOrigin.endsWith("/") &&
    webauthnOrigin.startsWith("https://");
  hints.push({
    key: "webauthn_production",
    ok: webauthnOk,
    detail: webauthnOk ?
      `WebAuthn RP ${rpId}`
    : siteUrl ?
      `set WEBAUTHN_RP_ID + WEBAUTHN_ORIGIN (e.g. from ${siteUrl})`
    : "set WEBAUTHN_RP_ID + WEBAUTHN_ORIGIN for passkeys in production",
    recommended: true,
  });

  return hints;
}
