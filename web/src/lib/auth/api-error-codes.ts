/** Códigos estáveis emitidos pelo BFF `/api/auth/*` — o cliente traduz pela locale ativa. */
export const AUTH_API_CODES = [
  "AUTH_RATE_LIMIT_LOGIN",
  "AUTH_RATE_LIMIT_REGISTER",
  "AUTH_RATE_LIMIT_FORGOT_PASSWORD",
  "AUTH_RATE_LIMIT_RESET_PASSWORD",
  "AUTH_RATE_LIMIT",
  "API_MISCONFIGURED",
  "INVALID_AUTH_RESPONSE",
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_EMAIL_IN_USE",
  "AUTH_PASSWORD_RESET_UNAVAILABLE",
  "AUTH_PASSWORD_RESET_INVALID",
  "AUTH_PASSWORD_RESET_EXPIRED",
  "VALIDATION_FAILED",
] as const;

export type AuthApiCode = (typeof AUTH_API_CODES)[number];

/** Erros estruturais `/api/market-ai` para o cliente mapear em `AiApiErrors`. */
export const MARKET_AI_API_CODES = [
  "MARKET_AI_JWT_UNAVAILABLE",
  "MARKET_AI_SESSION_REQUIRED",
  "MARKET_AI_BODY_INVALID",
  "MARKET_AI_JSON_INVALID",
  "MARKET_AI_BODY_TOO_LARGE",
  "MARKET_AI_RATE_LIMITED",
  "MARKET_AI_NO_ENGINE",
  "MARKET_AI_MODEL_UNAVAILABLE",
] as const;

export type MarketAiApiCode = (typeof MARKET_AI_API_CODES)[number];

export function isAuthApiCode(code: unknown): code is AuthApiCode {
  return typeof code === "string" && AUTH_API_CODES.includes(code as AuthApiCode);
}

export function isMarketAiApiCode(code: unknown): code is MarketAiApiCode {
  return (
    typeof code === "string" &&
    MARKET_AI_API_CODES.includes(code as MarketAiApiCode)
  );
}
