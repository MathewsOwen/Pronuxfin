import type { AuthMarketLogoCategory } from "@/lib/market/auth-market-logo-universe";

export type AuthMarketLogo = {
  symbol: string;
  shortName?: string;
  imageUrl: string;
  category: AuthMarketLogoCategory;
};

export function logosForMarquee(
  logos: AuthMarketLogo[],
  category: AuthMarketLogoCategory | AuthMarketLogoCategory[],
): AuthMarketLogo[] {
  const cats = Array.isArray(category) ? category : [category];
  return logos.filter((l) => cats.includes(l.category));
}

/** Posições em anéis elípticos ao redor do formulário. */
export function layoutAuthMarketLogoOrbits(logos: AuthMarketLogo[]): Array<
  AuthMarketLogo & { x: number; y: number; delay: number; ring: number }
> {
  const banks = logos.filter((l) => l.category === "bank" || l.category === "exchange");
  const br = logos.filter((l) => l.category === "br-equity");
  const global = logos.filter((l) => l.category === "intl" || l.category === "crypto");

  const rings: AuthMarketLogo[][] = [banks, br, global];

  return rings.flatMap((ringLogos, ringIndex) => {
    const rx = 40 + ringIndex * 4;
    const ry = 34 + ringIndex * 3;
    const total = ringLogos.length || 1;

    return ringLogos.map((logo, index) => {
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2 + ringIndex * 0.35;
      return {
        ...logo,
        x: 50 + Math.cos(angle) * rx,
        y: 46 + Math.sin(angle) * ry,
        delay: ringIndex * 0.25 + index * 0.08,
        ring: ringIndex,
      };
    });
  });
}
