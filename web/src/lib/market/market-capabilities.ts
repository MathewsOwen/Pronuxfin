import { shouldUseSimulatedMarketData } from "@/lib/market/market-data-policy";
import { isFmpApiKeyConfigured, isFmpProviderEnabled } from "@/lib/market/fmp-config";
import { isMarketProviderEnabled } from "@/lib/market/market-provider-registry";

export { isFmpApiKeyConfigured, isFmpProviderEnabled } from "@/lib/market/fmp-config";

export type MarketCapabilities = {
  simulationAllowed: boolean;
  productionStrict: boolean;
  brapi: { configured: boolean; providerEnabled: boolean };
  fmp: { configured: boolean; providerEnabled: boolean };
  coingecko: { providerEnabled: boolean };
  readyForLiveDesk: boolean;
  recommendations: string[];
};

export function isBrapiTokenConfigured(): boolean {
  return Boolean(process.env.BRAPI_TOKEN?.trim());
}

export function evaluateMarketCapabilities(): MarketCapabilities {
  const brapiConfigured = isBrapiTokenConfigured();
  const fmpConfigured = isFmpApiKeyConfigured();
  const brapiEnabled = isMarketProviderEnabled("brapi");
  const fmpEnabled = isFmpProviderEnabled();
  const coingeckoEnabled = isMarketProviderEnabled("coingecko");

  const recommendations: string[] = [];
  if (!brapiConfigured) {
    recommendations.push("configure BRAPI_TOKEN for stable B3 quotes");
  }
  if (!fmpConfigured) {
    recommendations.push("configure FMP_API_KEY for international dossiers and earnings calendar");
  }
  if (process.env.NODE_ENV === "production" && shouldUseSimulatedMarketData()) {
    recommendations.push("MARKET_ALLOW_SIMULATION=1 is set — not suitable for public go-live");
  }

  const readyForLiveDesk =
    brapiConfigured && coingeckoEnabled && !shouldUseSimulatedMarketData();

  return {
    simulationAllowed: shouldUseSimulatedMarketData(),
    productionStrict: process.env.NODE_ENV === "production" && !shouldUseSimulatedMarketData(),
    brapi: { configured: brapiConfigured, providerEnabled: brapiEnabled },
    fmp: { configured: fmpConfigured, providerEnabled: fmpEnabled },
    coingecko: { providerEnabled: coingeckoEnabled },
    readyForLiveDesk,
    recommendations,
  };
}
