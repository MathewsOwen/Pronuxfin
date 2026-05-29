import { importSPKI, jwtVerify, type JWTPayload } from "jose";

export type JwtAlgorithm = "HS256" | "RS256";

export function resolveJwtAlgorithm(): JwtAlgorithm {
  const raw = process.env.JWT_ALGORITHM?.trim().toUpperCase();
  return raw === "RS256" ? "RS256" : "HS256";
}

function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

type VerifyKey = Uint8Array | CryptoKey;

let cachedVerifyKey: VerifyKey | null = null;

async function loadVerifyKey(): Promise<VerifyKey> {
  if (cachedVerifyKey) return cachedVerifyKey;

  const algorithm = resolveJwtAlgorithm();
  if (algorithm === "RS256") {
    const pem = process.env.JWT_PUBLIC_KEY?.trim();
    if (!pem) {
      throw new Error("JWT_PUBLIC_KEY is required when JWT_ALGORITHM=RS256");
    }
    cachedVerifyKey = await importSPKI(normalizePem(pem), "RS256");
    return cachedVerifyKey;
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET is required when JWT_ALGORITHM=HS256");
  }
  cachedVerifyKey = new TextEncoder().encode(secret);
  return cachedVerifyKey;
}

export async function verifyAccessJwt(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const key = await loadVerifyKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: [resolveJwtAlgorithm()],
    });
    return payload;
  } catch {
    return null;
  }
}

/** @internal — resets cached key (tests). */
export function resetJwtVerifyKeyCache(): void {
  cachedVerifyKey = null;
}
