"use client";

import { motion, useReducedMotion } from "framer-motion";

import { AuthMarketLogoChip } from "@/components/auth/auth-market-logo-chip";
import type { AuthMarketLogo } from "@/lib/market/auth-market-logo-types";
import { cn } from "@/lib/utils";

type ZonePlacement = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const PLACEMENT: Record<ZonePlacement, string> = {
  "top-left": "left-[3%] top-[14%] sm:left-[4%] sm:top-[15%]",
  "top-right": "right-[3%] top-[14%] sm:right-[4%] sm:top-[15%]",
  "bottom-left": "left-[3%] bottom-[10%] sm:left-[4%] sm:bottom-[11%]",
  "bottom-right": "right-[3%] bottom-[10%] sm:right-[4%] sm:bottom-[11%]",
};

const ACCENT: Record<ZonePlacement, string> = {
  "top-left": "from-primary/25 via-primary/5 to-transparent border-primary/20",
  "top-right": "from-cognitive/25 via-cognitive/5 to-transparent border-cognitive/20",
  "bottom-left": "from-teal-400/20 via-teal-400/5 to-transparent border-teal-400/15",
  "bottom-right": "from-sky-400/20 via-sky-400/5 to-transparent border-sky-400/15",
};

type Props = {
  title: string;
  logos: AuthMarketLogo[];
  placement: ZonePlacement;
  animate: boolean;
  index: number;
};

export function AuthMarketCategoryZone({
  title,
  logos,
  placement,
  animate,
  index,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  if (logos.length === 0) return null;

  return (
    <motion.div
      className={cn(
        "absolute z-[1] hidden w-[min(11.5rem,30vw)] sm:block md:w-[min(13rem,26vw)] lg:w-[min(14rem,22vw)]",
        PLACEMENT[placement],
      )}
      initial={animate ? { opacity: 0, y: placement.startsWith("top") ? -12 : 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-gradient-to-br p-3 backdrop-blur-md",
          "shadow-[0_16px_48px_oklch(0_0_0/0.35)]",
          ACCENT[placement],
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />
        <p className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.24em] text-foreground/75">
          {title}
        </p>
        <ul className="grid grid-cols-4 gap-x-2 gap-y-2.5 md:grid-cols-5">
          {logos.map((logo, logoIndex) => (
            <li key={logo.symbol} className="flex flex-col items-center gap-1">
              <motion.div
                animate={
                  prefersReducedMotion || !animate
                    ? undefined
                    : { y: [0, logoIndex % 2 === 0 ? -3 : 3, 0] }
                }
                transition={{
                  duration: 5 + (logoIndex % 4) * 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: logoIndex * 0.08,
                }}
              >
                <AuthMarketLogoChip
                  symbol={logo.symbol}
                  imageUrl={logo.imageUrl}
                  size={34}
                  className="shadow-[0_6px_20px_oklch(0_0_0/0.28)]"
                />
              </motion.div>
              <span className="max-w-full truncate font-mono text-[7px] uppercase tracking-wide text-muted-foreground/80">
                {logo.symbol}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
