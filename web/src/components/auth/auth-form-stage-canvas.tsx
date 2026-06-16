"use client";

import { motion, useReducedMotion } from "framer-motion";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 37) % 84)}%`,
  top: `${6 + ((i * 53) % 88)}%`,
  size: 1 + (i % 2),
  delay: (i % 10) * 0.35,
  duration: 14 + (i % 7) * 2.5,
  drift: i % 2 === 0 ? 28 : -22,
}));

const STREAMS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: `${12 + i * 15}%`,
  delay: i * 1.8,
  duration: 9 + i * 1.2,
}));

/**
 * Cenário criativo atrás do formulário de auth —
 * aurora, anéis orbitais, grid em perspectiva e partículas.
 */
export function AuthFormStageCanvas() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[oklch(0.055_0.028_262)]"
      data-auth-form-stage
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_85%_15%,color-mix(in_oklch,var(--cognitive)_12%,transparent),transparent_60%)]" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_8%,transparent)] to-transparent lg:w-48" />

      {!prefersReducedMotion ? (
        <>
          <motion.div
            className="absolute left-[20%] top-[18%] size-[520px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_68%)] blur-[110px]"
            animate={{ x: [0, 48, -20, 0], y: [0, -32, 16, 0], scale: [1, 1.12, 0.96, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[12%] right-[8%] size-[440px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--cognitive)_22%,transparent),transparent_70%)] blur-[100px]"
            animate={{ x: [0, -40, 24, 0], y: [0, 28, -12, 0], scale: [1, 1.08, 1.04, 1] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-[55%] top-[55%] size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.72_0.14_195/0.12),transparent_72%)] blur-[90px]"
            animate={{ opacity: [0.5, 0.9, 0.55], scale: [0.92, 1.06, 0.94] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : (
        <>
          <div className="absolute left-1/4 top-1/4 size-[480px] rounded-full bg-primary/14 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 size-[400px] rounded-full bg-cognitive/10 blur-[100px]" />
        </>
      )}

      <div className="absolute left-1/2 top-[42%] size-[min(680px,95vw)] -translate-x-1/2 -translate-y-1/2">
        {!prefersReducedMotion ? (
          <>
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={ring}
                className="absolute inset-0 rounded-full border border-primary/15"
                style={{
                  margin: `${ring * 36}px`,
                  boxShadow: `inset 0 0 ${40 + ring * 20}px color-mix(in oklch, var(--primary) ${8 - ring * 2}%, transparent)`,
                }}
                animate={{ rotate: ring % 2 === 0 ? 360 : -360, opacity: [0.35, 0.65, 0.35] }}
                transition={{
                  rotate: { duration: 48 + ring * 12, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 6 + ring * 2, repeat: Infinity, ease: "easeInOut" },
                }}
              />
            ))}
          </>
        ) : (
          <div className="absolute inset-8 rounded-full border border-primary/20" />
        )}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-[42%] opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in oklch, var(--primary) 14%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in oklch, var(--primary) 14%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to top, black 0%, transparent 85%)",
          transform: "perspective(420px) rotateX(58deg) scale(1.4)",
          transformOrigin: "center bottom",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in oklch, var(--primary) 7%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in oklch, var(--primary) 7%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 42%, black 15%, transparent 72%)",
        }}
      />

      {!prefersReducedMotion
        ? STREAMS.map((stream) => (
            <motion.div
              key={stream.id}
              className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent"
              style={{ left: stream.left }}
              animate={{ y: ["-100%", "100%"], opacity: [0, 0.6, 0] }}
              transition={{
                duration: stream.duration,
                repeat: Infinity,
                delay: stream.delay,
                ease: "linear",
              }}
            />
          ))
        : null}

      {!prefersReducedMotion
        ? PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full bg-primary/70 shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, p.drift, 0],
                opacity: [0.15, 0.75, 0.2],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))
        : null}

      {!prefersReducedMotion ? (
        <motion.div
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent"
          animate={{ y: ["-100%", "200%"], opacity: [0, 0.35, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        />
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_42%,transparent_0%,oklch(0.04_0.025_262/0.5)_100%)]" />
      <div className="noise-overlay absolute inset-0 opacity-[0.032]" />
    </div>
  );
}
