"use client";

import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";

const SiteSingularityBackdrop = dynamic(
  () =>
    import("@/components/marketing/site-singularity-backdrop").then((mod) => ({
      default: mod.SiteSingularityBackdrop,
    })),
  { ssr: false },
);

function CssAmbientFallback() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(oklch(0.1_0.038_262)_0%,transparent_40%,oklch(0.09_0.045_262)_100%)]" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_95%_85%_at_50%_45%,transparent_20%,oklch(0.055_0.045_262/0.72)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35] motion-safe:animate-pulse-soft"
        style={{
          backgroundImage: `
            linear-gradient(var(--primary) / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, var(--primary) / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 80% 55% at 50% 15%, black 20%, transparent 70%)",
        }}
      />
      <motion.div
        className="absolute -left-32 top-[18%] size-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in oklch, var(--primary) 18%, transparent),transparent_68%)] blur-3xl motion-reduce:hidden"
        animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 bottom-[10%] size-[380px] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.18_265/0.12),transparent_68%)] blur-3xl motion-reduce:hidden"
        animate={{ x: [0, -22, 0], y: [0, 14, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

/** Fundo 3D contínuo (buraco negro) + camadas de legibilidade para o conteúdo. */
export function AmbientBackdrop({ mode = "webgl" }: { mode?: "css" | "webgl" }) {
  const reduceMotion = useReducedMotion();
  const useCss = mode === "css" || reduceMotion;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      data-marketing-ambient
      aria-hidden
    >
      {useCss ? <CssAmbientFallback /> : <SiteSingularityBackdrop />}

      <div className="absolute inset-0 bg-[#010103]/55" />

      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_42%,transparent_0%,rgba(1,1,3,0.55)_55%,rgba(1,1,3,0.92)_100%)]"
        aria-hidden
      />

      <div className="absolute inset-0 bg-gradient-to-b from-background/72 via-background/28 to-background/88" />

      <div
        className="absolute inset-0 opacity-[0.22] motion-safe:animate-pulse-soft"
        style={{
          backgroundImage: `
            linear-gradient(var(--primary) / 0.05) 1px, transparent 1px),
            linear-gradient(90deg, var(--primary) / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 85% 60% at 50% 12%, black 15%, transparent 72%)",
        }}
      />

      <div className="noise-overlay absolute inset-0 opacity-[0.028]" aria-hidden />
    </div>
  );
}
