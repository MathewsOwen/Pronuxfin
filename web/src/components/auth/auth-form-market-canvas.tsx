"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { AuthMarketCategoryZone } from "@/components/auth/auth-market-category-zone";
import { AuthMarketLogoChip } from "@/components/auth/auth-market-logo-chip";
import type { AuthMarketLogo } from "@/lib/market/auth-market-logo-types";
import { groupAuthMarketLogosByCategory } from "@/lib/market/auth-market-logo-types";

const CHART_POINTS =
  "M 0 88 L 28 72 L 52 78 L 78 48 L 104 56 L 128 32 L 152 40 L 176 18 L 200 28 L 224 8 L 248 22 L 272 12 L 296 26 L 320 14";

const CANDLES = [
  { x: 24, o: 70, c: 58, h: 52, l: 74, up: true },
  { x: 48, o: 58, c: 64, h: 54, l: 68, up: false },
  { x: 72, o: 64, c: 48, h: 42, l: 68, up: true },
  { x: 96, o: 48, c: 52, h: 44, l: 58, up: false },
  { x: 120, o: 52, c: 36, h: 30, l: 56, up: true },
  { x: 144, o: 36, c: 42, h: 32, l: 46, up: false },
  { x: 168, o: 42, c: 28, h: 22, l: 46, up: true },
  { x: 192, o: 28, c: 34, h: 26, l: 38, up: false },
  { x: 216, o: 34, c: 20, h: 14, l: 38, up: true },
  { x: 240, o: 20, c: 26, h: 16, l: 30, up: false },
] as const;

function MarketPulseChart({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 320 96" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="auth-market-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {CANDLES.map((c) => {
        const bodyTop = Math.min(c.o, c.c);
        const bodyH = Math.max(Math.abs(c.o - c.c), 2);
        const color = c.up ? "var(--market-up)" : "var(--market-down)";
        return (
          <g key={c.x} opacity={0.35}>
            <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={color} strokeWidth={1} />
            <rect x={c.x - 5} y={bodyTop} width={10} height={bodyH} fill={color} rx={1} />
          </g>
        );
      })}
      <motion.path
        d={`${CHART_POINTS} L 320 96 L 0 96 Z`}
        fill="url(#auth-market-chart-fill)"
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={CHART_POINTS}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0.35 } : false}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Cenário de mercado com logos reais organizados por categoria. */
export function AuthFormMarketCanvas() {
  const t = useTranslations("AuthMarketCanvas");
  const prefersReducedMotion = useReducedMotion();
  const animate = !prefersReducedMotion;
  const [logos, setLogos] = useState<AuthMarketLogo[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/market-logos", { cache: "force-cache" });
        const json = (await res.json()) as { logos?: AuthMarketLogo[] };
        if (!cancelled && Array.isArray(json.logos)) {
          setLogos(json.logos);
        }
      } catch {
        /* decorativo */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => groupAuthMarketLogosByCategory(logos), [logos]);

  const zones = useMemo(
    () =>
      [
        { key: "banks", title: t("categoryBanks"), logos: groups.banks, placement: "top-left" as const },
        { key: "crypto", title: t("categoryCrypto"), logos: groups.crypto, placement: "top-right" as const },
        {
          key: "brEquity",
          title: t("categoryBrEquity"),
          logos: groups.brEquity,
          placement: "bottom-left" as const,
        },
        { key: "intl", title: t("categoryIntl"), logos: groups.intl, placement: "bottom-right" as const },
      ] as const,
    [groups, t],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[oklch(0.052_0.026_262)]"
      data-auth-market-stage
      aria-hidden
    >
      <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_6%,transparent)] to-transparent lg:w-52" />
      <div className="terminal-grid-bg absolute inset-0 opacity-[0.04]" />

      <div className="absolute inset-x-0 top-[4%] flex justify-center px-6 sm:px-10">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-status-live shadow-[0_0_8px_var(--status-live-glow)] motion-safe:animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-status-live/90">
            {t("liveTag")}
          </span>
        </div>
      </div>

      <div className="absolute inset-x-[6%] top-[22%] h-[14%] opacity-60 sm:inset-x-[12%]">
        <MarketPulseChart animate={animate} />
      </div>

      {zones.map((zone, index) => (
        <AuthMarketCategoryZone
          key={zone.key}
          title={zone.title}
          logos={zone.logos}
          placement={zone.placement}
          animate={animate}
          index={index}
        />
      ))}

      <div className="absolute inset-x-0 top-[10%] space-y-2 px-3 sm:hidden">
        {zones.map((zone) =>
          zone.logos.length === 0 ? null : (
            <div
              key={`mobile-${zone.key}`}
              className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 backdrop-blur-sm"
            >
              <p className="mb-1.5 font-mono text-[7px] uppercase tracking-[0.2em] text-muted-foreground">
                {zone.title}
              </p>
              <ul className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {zone.logos.map((logo) => (
                  <li key={logo.symbol} className="flex shrink-0 flex-col items-center gap-0.5">
                    <AuthMarketLogoChip symbol={logo.symbol} imageUrl={logo.imageUrl} size={30} />
                    <span className="font-mono text-[6px] uppercase text-muted-foreground/75">
                      {logo.symbol}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>

      <div className="absolute inset-x-0 bottom-[3%] px-6 text-center sm:px-10">
        <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/45">
          {t("decorativeNote")}
        </p>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_38%_at_50%_48%,transparent_0%,oklch(0.04_0.022_262/0.78)_100%)]" />
      <div className="noise-overlay absolute inset-0 opacity-[0.028]" />
    </div>
  );
}
