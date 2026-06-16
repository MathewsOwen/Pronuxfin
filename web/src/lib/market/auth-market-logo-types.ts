import type { AuthMarketLogoCategory } from "@/lib/market/auth-market-logo-universe";

export type AuthMarketLogo = {
  symbol: string;
  shortName?: string;
  imageUrl: string;
  category: AuthMarketLogoCategory;
};

export type AuthMarketLogoGroups = {
  banks: AuthMarketLogo[];
  brEquity: AuthMarketLogo[];
  crypto: AuthMarketLogo[];
  intl: AuthMarketLogo[];
};

export function logosForMarquee(
  logos: AuthMarketLogo[],
  category: AuthMarketLogoCategory | AuthMarketLogoCategory[],
): AuthMarketLogo[] {
  const cats = Array.isArray(category) ? category : [category];
  return logos.filter((l) => cats.includes(l.category));
}

/** Agrupa logos por categoria para os painéis laterais. */
export function groupAuthMarketLogosByCategory(logos: AuthMarketLogo[]): AuthMarketLogoGroups {
  return {
    banks: logos.filter((l) => l.category === "bank" || l.category === "exchange"),
    brEquity: logos.filter((l) => l.category === "br-equity"),
    crypto: logos.filter((l) => l.category === "crypto"),
    intl: logos.filter((l) => l.category === "intl"),
  };
}
