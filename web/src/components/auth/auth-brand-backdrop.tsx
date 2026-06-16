"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { AuthBrandCanvas } from "@/components/auth/auth-brand-canvas";

const SiteSingularityBackdrop = dynamic(
  () =>
    import("@/components/marketing/site-singularity-backdrop").then((mod) => ({
      default: mod.SiteSingularityBackdrop,
    })),
  { ssr: false },
);

function useLgViewport() {
  const [lg, setLg] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLg(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return lg;
}

/**
 * Fundo 3D (singularity) confinado ao painel esquerdo de auth —
 * mesma engine da landing, com máscaras de legibilidade para o texto.
 */
export function AuthBrandBackdrop() {
  const prefersReducedMotion = useReducedMotion();
  const lg = useLgViewport();
  const useWebgl = lg && !prefersReducedMotion;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-auth-brand-backdrop
      aria-hidden
    >
      {useWebgl ? (
        <>
          <div className="absolute inset-0 pointer-events-auto">
            <SiteSingularityBackdrop />
          </div>
          <div className="absolute inset-0 bg-[oklch(0.07_0.035_262/0.38)]" />
        </>
      ) : (
        <AuthBrandCanvas intensity="full" />
      )}

      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_28%_30%,transparent_0%,oklch(0.06_0.03_262/0.55)_55%,oklch(0.05_0.035_262/0.92)_100%)]"
        aria-hidden
      />

      <div
        className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[oklch(0.06_0.03_262/0.85)] to-transparent"
        aria-hidden
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.07_0.035_262/0.35)] via-transparent to-[oklch(0.05_0.035_262/0.65)]" />

      {useWebgl ? <AuthBrandCanvas intensity="subtle" /> : null}

      <div className="noise-overlay absolute inset-0 opacity-[0.025]" aria-hidden />
    </div>
  );
}
