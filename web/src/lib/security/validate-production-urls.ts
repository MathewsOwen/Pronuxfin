/** Ensures a public production URL uses HTTPS (no trailing slash). */
export function assertHttpsProductionUrl(name: string, raw: string): void {
  const value = raw.trim();
  if (!value) {
    throw new Error(`${name} is required in production.`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL in production.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS in production.`);
  }
  if (value.endsWith("/")) {
    throw new Error(`${name} must not have a trailing slash in production.`);
  }
}
