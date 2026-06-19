/**
 * Ranking editorial de corretoras BR — liquidez típica na B3 e nota de confiança.
 * Não é feed de order book em tempo real; atualize trimestralmente com dados públicos (B3/CVM).
 * Links de afiliado: NEXT_PUBLIC_BROKER_AFFILIATE_{ID} (ex.: XP, BTG).
 */

export type BrokerDeskEntry = {
  id: string;
  /** 1 = maior liquidez típica no varejo BR */
  liquidityRank: number;
  /** 1–5 — solidez regulatória, histórico e escala */
  trustScore: 1 | 2 | 3 | 4 | 5;
  /** Mercados cobertos */
  markets: Array<"br" | "us" | "crypto">;
  siteUrl: string;
};

export const BROKER_DESK_CATALOG: BrokerDeskEntry[] = [
  {
    id: "XP",
    liquidityRank: 1,
    trustScore: 5,
    markets: ["br", "us", "crypto"],
    siteUrl: "https://www.xpi.com.br",
  },
  {
    id: "BTG",
    liquidityRank: 2,
    trustScore: 5,
    markets: ["br", "us", "crypto"],
    siteUrl: "https://www.btgpactual.com",
  },
  {
    id: "RICO",
    liquidityRank: 3,
    trustScore: 4,
    markets: ["br", "us"],
    siteUrl: "https://www.rico.com.vc",
  },
  {
    id: "CLEAR",
    liquidityRank: 4,
    trustScore: 4,
    markets: ["br", "us"],
    siteUrl: "https://www.clear.com.br",
  },
  {
    id: "NUINVEST",
    liquidityRank: 5,
    trustScore: 4,
    markets: ["br", "us"],
    siteUrl: "https://nuinvest.com.br",
  },
  {
    id: "INTER",
    liquidityRank: 6,
    trustScore: 4,
    markets: ["br", "us"],
    siteUrl: "https://www.bancointer.com.br",
  },
  {
    id: "TORO",
    liquidityRank: 7,
    trustScore: 4,
    markets: ["br", "us"],
    siteUrl: "https://www.toroinvestimentos.com.br",
  },
  {
    id: "GENIAL",
    liquidityRank: 8,
    trustScore: 4,
    markets: ["br", "us"],
    siteUrl: "https://www.genialinvestimentos.com.br",
  },
  {
    id: "AVENUE",
    liquidityRank: 9,
    trustScore: 5,
    markets: ["us", "crypto"],
    siteUrl: "https://www.avenue.us",
  },
  {
    id: "WARREN",
    liquidityRank: 10,
    trustScore: 4,
    markets: ["br"],
    siteUrl: "https://www.warren.com.br",
  },
];

/** Corretoras de bancões — máxima confiança regulatória (lista curada). */
export const BROKER_TRUST_PICKS = ["BTG", "XP", "AVENUE", "INTER", "NUINVEST"] as const;

export function getBrokerLiquidityLeaders(limit = 10): BrokerDeskEntry[] {
  return [...BROKER_DESK_CATALOG]
    .sort((a, b) => a.liquidityRank - b.liquidityRank)
    .slice(0, limit);
}

export function getBrokerTrustLeaders(): BrokerDeskEntry[] {
  const set = new Set<string>(BROKER_TRUST_PICKS);
  return BROKER_DESK_CATALOG.filter((b) => set.has(b.id)).sort(
    (a, b) => b.trustScore - a.trustScore || a.liquidityRank - b.liquidityRank,
  );
}

export function resolveBrokerAffiliateUrl(brokerId: string): string | null {
  const key = `NEXT_PUBLIC_BROKER_AFFILIATE_${brokerId}`;
  const raw = process.env[key]?.trim();
  return raw && /^https?:\/\//i.test(raw) ? raw : null;
}

export function resolveBrokerHref(entry: BrokerDeskEntry): string {
  return resolveBrokerAffiliateUrl(entry.id) ?? entry.siteUrl;
}
