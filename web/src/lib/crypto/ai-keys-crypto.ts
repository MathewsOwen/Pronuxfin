import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

export function parseMasterKeyHex(): Buffer | null {
  const hex = process.env.AI_KEYS_ENCRYPTION_KEY?.trim();
  if (!hex || hex.length !== 64) return null;
  try {
    const buf = Buffer.from(hex, "hex");
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

export function isByokCryptoConfigured(): boolean {
  return !!parseMasterKeyHex();
}

export function encryptAiSecret(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptAiSecret(b64url: string, key: Buffer): string {
  const buf = Buffer.from(b64url, "base64url");
  if (buf.length < IV_LEN + TAG_LEN + 1) throw new Error("invalid_cipher_blob");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
