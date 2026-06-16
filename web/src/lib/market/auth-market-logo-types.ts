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

type OrbitRing = {
  logos: AuthMarketLogo[];
  rx: number;
  ry: number;
  phase: number;
};

/**
 * Anéis orbitais — bancos ficam só nas faixas animadas (marquee), não no hub,
 * para não tampar bolsa / cripto / exterior.
 */
export function layoutAuthMarketLogoOrbits(logos: AuthMarketLogo[]): Array<
  AuthMarketLogo & { x: number; y: number; delay: number; ring: number }
> {
  const br = logos.filter((l) => l.category === "br-equity");
  const crypto = logos.filter((l) => l.category === "crypto");
  const intl = logos.filter((l) => l.category === "intl");

  const rings: OrbitRing[] = [
    { logos: br, rx: 41, ry: 35, phase: 0 },
    { logos: crypto, rx: 45, ry: 38, phase: 0.25 },
    { logos: intl, rx: 45, ry: 38, phase: Math.PI + 0.25 },
  ];

  return rings.flatMap((ring, ringIndex) => {
    const total = ring.logos.length || 1;

    return ring.logos.map((logo, index) => {
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2 + ring.phase;
      return {
        ...logo,
        x: 50 + Math.cos(angle) * ring.rx,
        y: 46 + Math.sin(angle) * ring.ry,
        delay: ringIndex * 0.22 + index * 0.07,
        ring: ringIndex,
      };
    });
  });
}
