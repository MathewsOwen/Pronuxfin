"use client";

import { motion } from "framer-motion";

/** Fundo cinematográfico leve — grids + orbes lentos (respeita reduced-motion via CSS). */
export function AmbientBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      aria-hidden
    >
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
        className="absolute -left-32 top-[18%] size-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_%,transparent),transparent_68%)] blur-3xl motion-reduce:hidden"
        animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 bottom-[10%] size-[380px] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.18_265/0.12),transparent_68%)] blur-3xl motion-reduce:hidden"
        animate={{ x: [0, -22, 0], y: [0, 14, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[42%] top-[52%] size-[280px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.78_0.1_195/0.08),transparent_70%)] blur-3xl motion-reduce:hidden"
        animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.06, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="noise-overlay absolute inset-0 opacity-[0.035]"
        aria-hidden
      />
    </div>
  );
}
