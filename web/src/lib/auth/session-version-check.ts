/** When true, access JWT `ver` must match User.tokenVersion in the database. */
export function isSessionVersionCheckEnabled(): boolean {
  if (process.env.AUTH_SESSION_VERSION_CHECK === "0") return false;
  if (process.env.NODE_ENV === "test") return false;
  return true;
}
