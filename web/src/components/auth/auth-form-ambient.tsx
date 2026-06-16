"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Luz ambiente atrás do cartão de login — profundidade sem distrair do formulário. */
export function AuthFormAmbient() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute left-1/2 top-1/3 size-[480px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]" />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="absolute left-[15%] top-[20%] size-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in oklch,var(--primary)_22%,transparent),transparent_70%)] blur-[100px]"
        animate={{ x: [0, 36, 0], y: [0, -24, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[10%] size-[360px] rounded-full bg-[radial-gradient(circle,color-mix(in oklch,var(--cognitive)_18%,transparent),transparent_68%)] blur-[90px]"
        animate={{ x: [0, -28, 0], y: [0, 18, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in oklch, var(--primary) 10%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in oklch, var(--primary) 10%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 10%, transparent 75%)",
        }}
      />
    </div>
  );
}
