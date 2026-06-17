"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { AuthMarketLogoChip } from "@/components/auth/auth-market-logo-chip";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import type { AuthMarketLogo } from "@/lib/market/auth-market-logo-types";
import {
  authMarketLogoLabel,
  layoutAuthMarketLogoOrbits,
  logosForMarquee,
  orbitNodePosition,
} from "@/lib/market/auth-market-logo-types";

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

const ORBIT_LOGO_SIZE = 40;
const ORBIT_ROTATION_SEC = 110;

function LogoTickerMarquee({
  logos,
  direction,
  tooltipPlacement = "bottom",
}: {
  logos: AuthMarketLogo[];
  direction: "left" | "right";
  tooltipPlacement?: "top" | "bottom";
}) {
  const prefersReducedMotion = useReducedMotion();
  if (logos.length === 0) return null;

  const duplex = [...logos, ...logos];

  return (
    <div className="pointer-events-auto relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/30 py-2 backdrop-blur-sm">
      <motion.div
        className="flex w-max items-center gap-6 px-4"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: direction === "right" ? 34 : 40, repeat: Infinity, ease: "linear" }
        }
      >
        {duplex.map((logo, i) => (
          <AuthMarketLogoChip
            key={`${logo.symbol}-${i}`}
            symbol={logo.symbol}
            imageUrl={logo.imageUrl}
            label={authMarketLogoLabel(logo)}
            size={28}
            showSymbol
            interactive
            tooltipPlacement={tooltipPlacement}
          />
        ))}
      </motion.div>
    </div>
  );
}

function MarketPulseChart({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 320 96" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="auth-market-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {CANDLES.map((c) => {
        const bodyTop = Math.min(c.o, c.c);
        const bodyH = Math.max(Math.abs(c.o - c.c), 2);
        const color = c.up ? "var(--market-up)" : "var(--market-down)";
        return (
          <g key={c.x} opacity={0.45}>
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
        transition={{ duration: 1.2 }}
      />
      <motion.path
        d={CHART_POINTS}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0.4 } : false}
        animate={{ pathLength: 1, opacity: 0.75 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
      />
    </svg>
  );
}

/**
 * Círculo de ações — preenche a zona entre as faixas superior e inferior.
 * Posição via CSS (sem JS) para não “grudar” no canto.
 */
function LogoConstellation({
  logos,
  animate,
}: {
  logos: AuthMarketLogo[];
  animate: boolean;
}) {
  const orbit = useMemo(() => layoutAuthMarketLogoOrbits(logos), [logos]);
  const [orbitHoverCount, setOrbitHoverCount] = useState(0);
  const orbitPaused = orbitHoverCount > 0;
  const spin = {
    duration: ORBIT_ROTATION_SEC,
    repeat: Infinity,
    ease: "linear" as const,
  };

  const handleOrbitHover = (enter: boolean) => {
    setOrbitHoverCount((count) => (enter ? count + 1 : Math.max(0, count - 1)));
  };

  return (
    <div className="pointer-events-none relative aspect-square size-full max-h-full max-w-full">
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[12] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl border border-primary/40 bg-[oklch(0.11_0.025_262/0.94)] p-2.5 shadow-[0_0_48px_color-mix(in_oklch,var(--primary)_28%,transparent)] backdrop-blur-md">
          <PronuxFinLogo variant="compact" className="h-8 w-auto" />
        </div>
      </div>

      {animate
        ? [0, 1, 2].map((i) => (
            <div key={i} className="absolute inset-0">
              <motion.div
                className="size-full rounded-full border border-primary/10"
                animate={{ opacity: [0.06 + i * 0.02, 0.18 + i * 0.02, 0.06 + i * 0.02] }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.8,
                }}
              />
            </div>
          ))
        : null}

      <div className="pointer-events-auto absolute inset-0 z-[4]">
        <motion.div
          className="relative size-full overflow-visible"
          animate={animate && !orbitPaused ? { rotate: 360 } : undefined}
          transition={spin}
        >
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            {orbit.map((node) => {
              const { x, y } = orbitNodePosition(node);
              return (
                <line
                  key={`line-${node.symbol}`}
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                  stroke="color-mix(in oklch, var(--primary) 22%, transparent)"
                  strokeWidth={0.15}
                  strokeDasharray="0.6 1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {orbit.map((node) => {
            const { x, y } = orbitNodePosition(node);
            return (
              <motion.div
                key={node.symbol}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
                initial={animate ? { opacity: 0, scale: 0.85 } : false}
                animate={
                  animate && !orbitPaused
                    ? { opacity: 1, scale: 1, rotate: -360 }
                    : { opacity: 1, scale: 1 }
                }
                transition={{
                  opacity: { duration: 0.5, delay: node.delay },
                  scale: { duration: 0.5, delay: node.delay },
                  rotate: spin,
                }}
                onMouseEnter={() => handleOrbitHover(true)}
                onMouseLeave={() => handleOrbitHover(false)}
              >
                <AuthMarketLogoChip
                  symbol={node.symbol}
                  imageUrl={node.imageUrl}
                  label={authMarketLogoLabel(node)}
                  size={ORBIT_LOGO_SIZE}
                  interactive
                  tooltipPlacement="top"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

/** Cenário de mercado com logos reais atrás do formulário de auth. */
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

  const brMarquee = useMemo(
    () => logosForMarquee(logos, ["bank", "br-equity", "exchange"]),
    [logos],
  );
  const cryptoMarquee = useMemo(() => logosForMarquee(logos, "crypto"), [logos]);
  const intlMarquee = useMemo(() => logosForMarquee(logos, "intl"), [logos]);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col overflow-hidden bg-[oklch(0.052_0.026_262)]"
      data-auth-market-stage
    >
      <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_6%,transparent)] to-transparent lg:w-52" />
      <div className="terminal-grid-bg absolute inset-0 opacity-[0.04]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_36%_at_50%_50%,transparent_0%,oklch(0.04_0.022_262/0.72)_100%)]" />
      <div className="noise-overlay absolute inset-0 opacity-[0.028]" />

      {/* Faixa superior — BR + crypto */}
      <div className="relative z-[2] shrink-0 space-y-2 px-6 pb-3 pt-[5%] sm:px-10">
        <div className="mb-1 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-status-live shadow-[0_0_8px_var(--status-live-glow)] motion-safe:animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-status-live/90">
            {t("liveTag")}
          </span>
        </div>
        <LogoTickerMarquee logos={brMarquee} direction="left" tooltipPlacement="bottom" />
        <LogoTickerMarquee logos={cryptoMarquee} direction="right" tooltipPlacement="bottom" />
      </div>

      {/* Zona das ações — círculo grande, centrado entre as duas faixas */}
      <div className="relative z-[1] flex min-h-0 flex-1 items-center justify-center overflow-visible px-4 py-3 sm:px-8 [container-type:size]">
        <div className="pointer-events-none absolute inset-x-[4%] inset-y-[6%] opacity-55 sm:inset-x-[8%]">
          <MarketPulseChart animate={animate} />
        </div>
        <div className="aspect-square size-[min(calc(100cqw-1.25rem),calc(100cqh-1.25rem))]">
          <LogoConstellation logos={logos} animate={animate} />
        </div>
      </div>

      {/* Faixa inferior — internacional */}
      <div className="relative z-[2] shrink-0 space-y-2 px-6 pb-[6%] pt-3 sm:px-10">
        <LogoTickerMarquee logos={intlMarquee} direction="left" tooltipPlacement="top" />
        <p className="text-center font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/45">
          {t("decorativeNote")}
        </p>
      </div>
    </div>
  );
}
