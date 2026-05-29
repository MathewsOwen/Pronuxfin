import * as THREE from "three";

export const ENTRY_MS = 1200;

export const TEAL = new THREE.Color(0x2dd4bf);
export const GOLD = new THREE.Color(0xd4c4a8);
export const COGNITIVE = new THREE.Color(0xa78bfa);

export const OFFERING_COLORS = [
  TEAL,
  new THREE.Color(0xede4d4),
  COGNITIVE,
  new THREE.Color(0x38bdf8),
  new THREE.Color(0xfbbf60),
  new THREE.Color(0x6ee7b7),
  new THREE.Color(0xd9778e),
  new THREE.Color(0x818cf8),
  new THREE.Color(0x34d399),
  new THREE.Color(0xc4b5fd),
];

export const RING_RADII = [0.24, 0.36, 0.5, 0.64, 0.76];

export type EntryState = {
  raw: number;
  progress: number;
  warpIn: number;
  funnel: number;
  sphere: number;
  terrain: number;
  galaxy: number;
  cosmos: number;
  phase: "warp" | "form" | "reveal" | "ready";
};

export type PhaseState = {
  current: number;
  target: number;
  blend: number;
};

export type PhaseConfig = {
  morph: number;
  compress: number;
  intensity: number;
  rotate: number;
  camY: number;
  camDist: number;
  orbit: number;
  lensing: number;
};

export const SCENE_PHASES: PhaseConfig[] = [
  { morph: 0.06, compress: 1.0, intensity: 1.05, rotate: 0.05, camY: 4.8, camDist: 15, orbit: 0.35, lensing: 0.07 },
  { morph: 1.2, compress: 1.04, intensity: 1.15, rotate: 0.06, camY: 5.2, camDist: 15.5, orbit: 0.4, lensing: 0.08 },
  { morph: 0.4, compress: 0.85, intensity: 1.25, rotate: 0.07, camY: 4.5, camDist: 14.5, orbit: 0.45, lensing: 0.09 },
];

export type OfferingSpec = {
  ring: number;
  phase: number;
  color: THREE.Color;
};

export function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function computeEntry(elapsed: number, reduceMotion: boolean): EntryState {
  if (reduceMotion) {
    return {
      raw: 1,
      progress: 1,
      warpIn: 0,
      funnel: 0,
      sphere: 0,
      terrain: 0,
      galaxy: 1,
      cosmos: 1,
      phase: "ready",
    };
  }
  const raw = clamp01(elapsed / ENTRY_MS);
  const progress = easeOutCubic(raw);
  return {
    raw,
    progress,
    warpIn: raw < 1 ? clamp01(1 - progress * 1.35) : 0,
    funnel: raw < 1 ? clamp01(Math.sin(progress * Math.PI) * 0.85) : 0,
    sphere: raw < 1 ? clamp01(Math.sin(progress * Math.PI * 1.05) * (1 - progress * 0.35)) : 0,
    terrain: raw < 1 ? easeInOutCubic(clamp01((progress - 0.28) / 0.55)) : 0,
    galaxy: raw < 1 ? easeOutCubic(clamp01((progress - 0.22) / 0.62)) : 0,
    cosmos: raw < 1 ? easeOutCubic(clamp01((progress - 0.08) / 0.42)) : 1,
    phase: raw < 0.18 ? "warp" : raw < 0.42 ? "form" : raw < 0.72 ? "reveal" : "ready",
  };
}

export function buildCameraPath() {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 2.2, 11.5),
      new THREE.Vector3(-5.2, 3.6, 7.2),
    ],
    false,
    "catmullrom",
    0.35,
  );
}

export function buildWarpParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const offsets = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.4 + Math.random() * 2.8;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = Math.sin(angle) * r;
    positions[i * 3 + 2] = Math.random() * 18;
    speeds[i] = 0.35 + Math.random() * 0.55;
    offsets[i] = Math.random();
  }
  return { positions, speeds, offsets };
}
