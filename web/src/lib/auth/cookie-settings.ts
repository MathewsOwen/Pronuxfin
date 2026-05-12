/** Cookie JWT: Secure quando build de produção ou COOKIE_SECURE=true (HTTPS atrás do proxy). */
export function secureAuthCookie(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true"
  );
}
