"use client";

import { useEffect, useState } from "react";

const MOBILE_MQ = "(max-width: 767px)";

export function useIntroMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

export const MOBILE_INTRO_SERVICE_IDS = [
  "ai",
  "dashboard",
  "forecasts",
  "security",
  "insights",
  "operations",
] as const;

export type SingularitySceneMode = "intro" | "ambient";

export function getSingularityViewportProfile(
  width: number,
  height: number,
  mode: SingularitySceneMode = "intro",
) {
  const isMobile = width < 768;
  const isPortrait = height > width;

  if (!isMobile) {
    return {
      isMobile: false,
      isPortrait,
      instanceCount: mode === "ambient" ? 4200 : 5000,
      pixelRatioCap: 2.5,
      camDistance: mode === "ambient" ? 90 : 85,
      orbitRadius: 41,
      crystalRadius: mode === "ambient" ? 0.5 : 0.55,
      sphereSegments: 64,
      labelCompact: false,
      antialias: true,
      toneMappingExposure: mode === "ambient" ? 1.45 : 1.6,
      autoRotateSpeed: mode === "ambient" ? 0.045 : 0.06,
      interactiveTilt: true,
    } as const;
  }

  return {
    isMobile: true,
    isPortrait,
    instanceCount: mode === "ambient" ? (isPortrait ? 1800 : 2400) : isPortrait ? 2200 : 2800,
    pixelRatioCap: 1.5,
    camDistance: mode === "ambient" ? (isPortrait ? 100 : 94) : isPortrait ? 98 : 92,
    orbitRadius: isPortrait ? 38.5 : 40,
    crystalRadius: mode === "ambient" ? 0.38 : 0.4,
    sphereSegments: 32,
    labelCompact: true,
    antialias: true,
    toneMappingExposure: mode === "ambient" ? 1.38 : 1.6,
    autoRotateSpeed: mode === "ambient" ? 0.04 : 0.06,
    interactiveTilt: true,
  } as const;
}

/** @deprecated Use getSingularityViewportProfile */
export function getIntroViewportProfile(width: number, height: number) {
  return getSingularityViewportProfile(width, height, "intro");
}

/**
 * Pixel-budget device pixel ratio.
 *
 * Capping by `devicePixelRatio` alone is not enough for "4K without lag": a
 * large/ultrawide monitor can have a low DPR yet a huge surface, so the total
 * rendered pixel count explodes once heavy shaders + post-processing run.
 *
 * Instead we cap the *total* rendered pixels (width·dpr · height·dpr) to a
 * budget. On normal screens this lands at a crisp 1.2–2× ratio; on 4K/5K it
 * settles toward 1× native (still sharp) instead of multiplying the load.
 */
export function computeBudgetedDpr(
  width: number,
  height: number,
  opts: { budgetPx?: number; hardCap?: number; mobile?: boolean } = {},
) {
  const ratio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const mobile = opts.mobile ?? width < 768;
  // Intro carries 5 full-screen post passes, so it gets a tighter budget than
  // the lighter ambient backdrop (callers can override).
  const budgetPx = opts.budgetPx ?? (mobile ? 2_400_000 : 5_200_000);
  const hardCap = opts.hardCap ?? (mobile ? 2 : 2.25);
  const area = Math.max(width * height, 1);
  const byBudget = Math.sqrt(budgetPx / area);
  // Never upscale past the device ratio, never go under 1 (would look soft).
  return Math.min(ratio, hardCap, Math.max(1, byBudget));
}
