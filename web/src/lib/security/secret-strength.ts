const WEAK_PATTERNS = [
  /^(.)\1{7,}$/i,
  /password/i,
  /secret/i,
  /change-?me/i,
  /test123/i,
  /pronuxfin/i,
];

/** Rejects low-entropy production secrets (INTERNAL_API_SECRET, HEALTH_PROBE_SECRET). */
export function assertStrongProductionSecret(name: string, value: string): void {
  const trimmed = value.trim();
  if (trimmed.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production.`);
  }

  for (const pattern of WEAK_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error(`${name} is too weak for production.`);
    }
  }

  const uniqueChars = new Set(trimmed).size;
  if (uniqueChars < 12) {
    throw new Error(`${name} lacks entropy (too few unique characters).`);
  }
}
