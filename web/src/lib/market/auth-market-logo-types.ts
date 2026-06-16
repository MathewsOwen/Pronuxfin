import type { AuthMarketLogoCategory } from "@/lib/market/auth-market-logo-universe";
import { INTL_DISPLAY_NAMES } from "@/lib/market/auth-market-logo-universe";

export type AuthMarketLogo = {
  symbol: string;
  shortName?: string;
  imageUrl: string;
  category: AuthMarketLogoCategory;
};

export type AuthMarketOrbitNode = AuthMarketLogo & {
  angleRad: number;
  rxPct: number;
  ryPct: number;
  delay: number;
  ring: number;
};

export function authMarketLogoLabel(logo: AuthMarketLogo): string {
  const name = logo.shortName?.trim();
  if (name && name !== logo.symbol) return name;
  return INTL_DISPLAY_NAMES[logo.symbol] ?? name ?? logo.symbol;
}

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

/** Anéis menores — bancos só no marquee. */
export function layoutAuthMarketLogoOrbits(logos: AuthMarketLogo[]): AuthMarketOrbitNode[] {
  const br = logos.filter((l) => l.category === "br-equity");
  const crypto = logos.filter((l) => l.category === "crypto");
  const intl = logos.filter((l) => l.category === "intl");

  const rings: OrbitRing[] = [
    { logos: br, rx: 28, ry: 24, phase: 0 },
    { logos: crypto, rx: 31, ry: 26, phase: 0.25 },
    { logos: intl, rx: 31, ry: 26, phase: Math.PI + 0.25 },
  ];

  return rings.flatMap((ring, ringIndex) => {
    const total = ring.logos.length || 1;

    return ring.logos.map((logo, index) => {
      const angleRad = (index / total) * Math.PI * 2 - Math.PI / 2 + ring.phase;
      return {
        ...logo,
        angleRad,
        rxPct: ring.rx / 100,
        ryPct: ring.ry / 100,
        delay: ringIndex * 0.22 + index * 0.07,
        ring: ringIndex,
      };
    });
  });
}

export function orbitNodePosition(node: AuthMarketOrbitNode): { x: number; y: number } {
  return {
    x: 50 + Math.cos(node.angleRad) * node.rxPct * 100,
    y: 50 + Math.sin(node.angleRad) * node.ryPct * 100,
  };
}
