import { loadCachedQuotesPayload } from "@/lib/market/market-data-gateway";

export async function loadQuotesPayload(): Promise<{
  payload: Awaited<ReturnType<typeof loadCachedQuotesPayload>>["payload"];
  warnings: string[];
}> {
  return loadCachedQuotesPayload();
}
