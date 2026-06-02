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
      shortFrame: false,
      instanceCount: mode === "ambient" ? 4200 : 1400,
      pixelRatioCap: 2.5,
      camDistance: mode === "ambient" ? 90 : 85,
      orbitRadius: 41,
      orbitSpread: 0.32,
      crystalRadius: mode === "ambient" ? 0.5 : 0.55,
      sphereSegments: 64,
      labelCompact: false,
      showCrystalLabels: true,
      diskRMax: 44,
      fov: 40,
      cameraPitch: 0.35,
      cameraYOffset: 0,
      antialias: true,
      toneMappingExposure: mode === "ambient" ? 1.45 : 1.6,
      autoRotateSpeed: mode === "ambient" ? 0.045 : 0.06,
      interactiveTilt: true,
    } as const;
  }

  const intro = mode === "intro";
  const shortFrame = intro && height < 520;
  return {
    isMobile: true,
    isPortrait,
    shortFrame,
    instanceCount: shortFrame
      ? 520
      : mode === "ambient"
        ? isPortrait
          ? 1800
          : 2400
        : isPortrait
          ? 640
          : 820,
    pixelRatioCap: 1.5,
    camDistance: intro
      ? shortFrame
        ? 74
        : isPortrait
          ? 96
          : 88
      : isPortrait
        ? 100
        : 94,
    orbitRadius: intro ? (shortFrame ? 24 : isPortrait ? 30 : 33) : isPortrait ? 36 : 38,
    orbitSpread: intro ? 0.12 : 0.2,
    crystalRadius: intro ? (shortFrame ? 0.38 : 0.34) : 0.38,
    sphereSegments: 32,
    labelCompact: true,
    showCrystalLabels: !intro,
    diskRMax: intro ? (shortFrame ? 30 : 34) : 40,
    fov: intro ? (shortFrame ? 58 : 50) : 42,
    cameraPitch: shortFrame ? 0.24 : 0.34,
    cameraYOffset: intro ? (shortFrame ? 2 : 4) : 2,
    antialias: true,
    toneMappingExposure: intro ? (shortFrame ? 1.72 : 1.58) : 1.38,
    autoRotateSpeed: mode === "ambient" ? 0.04 : 0.05,
    interactiveTilt: !intro,
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
