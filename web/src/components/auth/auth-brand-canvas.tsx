"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Fundo ambiente do painel de marca — apenas luz, grade e orbs (sem UI sobreposta). */
export function AuthBrandCanvas() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 top-16 size-[420px] rounded-full bg-primary/20 blur-[100px] motion-safe:animate-pulse-soft" />
      <div className="absolute bottom-0 right-0 size-[360px] rounded-full bg-cognitive/15 blur-[90px] motion-safe:animate-pulse-soft [animation-delay:1.2s]" />
      <div className="absolute left-1/3 top-1/2 size-[280px] -translate-y-1/2 rounded-full bg-teal-400/10 blur-[80px]" />

      {!prefersReducedMotion ? (
        <>
          <motion.div
            className="absolute -left-16 top-[28%] size-[320px] rounded-full bg-[radial-gradient(circle,color-mix(in oklch,var(--primary)_20%,transparent),transparent_68%)] blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
            transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[18%] right-[-4rem] size-[280px] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.18_265/0.14),transparent_68%)] blur-3xl"
            animate={{ x: [0, -32, 0], y: [0, 16, 0] }}
            transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : null}

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in oklch, var(--primary) 8%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in oklch, var(--primary) 8%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 30% 20%, black 20%, transparent 72%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent motion-safe:animate-pulse-soft" />
    </div>
  );
}
