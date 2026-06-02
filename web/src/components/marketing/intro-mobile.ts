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

/** 6 serviços principais — órbita travada no mobile. */
export const MOBILE_INTRO_SERVICE_IDS = [
  "ai",
  "dashboard",
  "forecasts",
  "security",
  "insights",
  "monitoring",
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
      instanceCount: mode === "ambient" ? 4200 : 2400,
      pixelRatioCap: 2.5,
      camDistance: mode === "ambient" ? 90 : 82,
      orbitRadius: 40,
      orbitSpread: 0,
      crystalRadius: mode === "ambient" ? 0.5 : 0.58,
      sphereSegments: 64,
      labelCompact: false,
      showCrystalLabels: true,
      crystalLockedOrbit: true,
      diskRMax: 48,
      diskOrbitScale: 0.64,
      diskIntensity: 1.22,
      auraIntensity: 1.0,
      fov: 40,
      cameraPitch: 0.33,
      cameraYOffset: 0,
      targetYOffset: 0,
      frontView: false,
      diskTiltX: 0,
      fixedCamera: false,
      autoRotate: true,
      crystalOrbitScale: 1,
      diskMorph: mode === "ambient" ? 0.08 : 0.12,
      antialias: true,
      toneMappingExposure: mode === "ambient" ? 1.48 : 1.68,
      autoRotateSpeed: mode === "ambient" ? 0.045 : 0.056,
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
      ? 720
      : mode === "ambient"
        ? isPortrait
          ? 1800
          : 2400
        : isPortrait
          ? 900
          : 980,
    pixelRatioCap: 1.5,
    camDistance: intro ? (shortFrame ? 84 : isPortrait ? 92 : 88) : isPortrait ? 100 : 94,
    orbitRadius: intro ? (shortFrame ? 24 : isPortrait ? 26 : 28) : isPortrait ? 36 : 38,
    orbitSpread: 0,
    crystalRadius: intro ? 0.42 : 0.38,
    sphereSegments: 32,
    labelCompact: true,
    showCrystalLabels: intro,
    crystalLockedOrbit: true,
    diskRMax: intro ? (shortFrame ? 32 : 34) : 40,
    diskOrbitScale: 0.66,
    diskIntensity: 1.26,
    auraIntensity: 1.05,
    fov: intro ? (shortFrame ? 42 : 40) : 42,
    cameraPitch: intro ? 0.36 : 0.34,
    cameraYOffset: 0,
    targetYOffset: 0,
    frontView: intro,
    diskTiltX: intro ? 0.34 : 0,
    fixedCamera: intro,
    autoRotate: !intro,
    crystalOrbitScale: intro ? 1.45 : 1,
    diskMorph: intro ? 0.05 : 0.1,
    antialias: true,
    toneMappingExposure: intro ? 1.72 : 1.38,
    autoRotateSpeed: mode === "ambient" ? 0.04 : 0.054,
    interactiveTilt: !intro,
  } as const;
}

/** @deprecated Use getSingularityViewportProfile */
export function getIntroViewportProfile(width: number, height: number) {
  return getSingularityViewportProfile(width, height, "intro");
}

export function computeBudgetedDpr(
  width: number,
  height: number,
  opts: { budgetPx?: number; hardCap?: number; mobile?: boolean } = {},
) {
  const ratio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const mobile = opts.mobile ?? width < 768;
  const budgetPx = opts.budgetPx ?? (mobile ? 2_400_000 : 5_200_000);
  const hardCap = opts.hardCap ?? (mobile ? 2 : 2.25);
  const area = Math.max(width * height, 1);
  const byBudget = Math.sqrt(budgetPx / area);
  return Math.min(ratio, hardCap, Math.max(1, byBudget));
}
