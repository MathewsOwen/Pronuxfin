import { headers } from "next/headers";

/** Per-request nonce set by middleware (`x-nonce`). */
export async function getCspNonce(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-nonce") ?? undefined;
}
