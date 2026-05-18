import type { MarketDataTask } from "@/lib/market/market-provider-registry";

/** Modo de exibição agregado para a mesa / strip. */
export type MarketDataMode = "live" | "simulated" | "degraded";

/**
 * Em produção, cotações simuladas só são permitidas com opt-in explícito
 * (`MARKET_ALLOW_SIMULATION=1`) — típico de demos internas, nunca go-live público.
 */
export function shouldUseSimulatedMarketData(): boolean {
  if (process.env.MARKET_ALLOW_SIMULATION === "1") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export function isProductionMarketStrict(): boolean {
  return process.env.NODE_ENV === "production" && !shouldUseSimulatedMarketData();
}

export function marketSimulationBlockedWarning(task: MarketDataTask): string {
  return `market_simulation_blocked:${task}`;
}

/**
 * Executa fallback simulado apenas quando a política permite; caso contrário devolve
 * livro vazio com aviso explícito (sem números inventados silenciosos).
 */
export function resolveMarketProviderFallback<T extends {
  rows: unknown[];
  simulated: boolean;
  partial: boolean;
  warning?: string;
}>(task: MarketDataTask, produceSimulation: () => T): T {
  if (shouldUseSimulatedMarketData()) {
    const result = produceSimulation();
    return { ...result, simulated: true };
  }

  return {
    rows: [],
    simulated: false,
    partial: true,
    warning: marketSimulationBlockedWarning(task),
  } as unknown as T;
}

export function resolveQuotesDataMode(input: {
  resultsCount: number;
  cryptoCount: number;
  simulated?: boolean;
  cryptoSimulated?: boolean;
}): MarketDataMode {
  if (input.simulated || input.cryptoSimulated) return "simulated";
  if (input.resultsCount === 0 && input.cryptoCount === 0) return "degraded";
  return "live";
}
