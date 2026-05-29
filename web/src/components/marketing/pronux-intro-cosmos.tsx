"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const GOLD = { r: 212, g: 196, b: 168 };
const GOLD_HOT = { r: 237, g: 228, b: 212 };
const TEAL = { r: 45, g: 212, b: 191 };
const COGNITIVE = { r: 167, g: 139, b: 250 };

/** Paleta das ofertas em órbita (teal marca + dourado + acentos). */
const OFFERING_COLORS = [
  TEAL,
  GOLD_HOT,
  COGNITIVE,
  { r: 56, g: 189, b: 248 },
  { r: 251, g: 191, b: 96 },
  { r: 110, g: 231, b: 183 },
  { r: 217, g: 119, b: 142 },
  { r: 129, g: 140, b: 248 },
  { r: 52, g: 211, b: 153 },
  { r: 196, g: 181, b: 253 },
] as const;

type RingSpec = { radius: number; speed: number; tilt: number; width: number; hue: "gold" | "teal" };

type OfferingEmphasis = "core" | "inner" | "standard";

type OfferingSpec = {
  label: string;
  sublabel?: string;
  description?: string;
  ring: number;
  phase: number;
  color: { r: number; g: number; b: number };
  wobble: number;
  emphasis: OfferingEmphasis;
  hoverBlend: number;
  crystalParticles: CrystalParticleSpec[];
  trail: { x: number; y: number }[];
};

type StarSpec = { x: number; y: number; z: number; phase: number; size: number };

type PhotonSpec = {
  angle: number;
  radius: number;
  speed: number;
  color: { r: number; g: number; b: number };
  trail: { x: number; y: number }[];
};

type DustSpec = {
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  drift: number;
};

type NebulaSpec = { x: number; y: number; r: number; phase: number; depth: number };

type CrystalParticleSpec = { angle: number; radius: number; speed: number; size: number };

type StardustSpec = { x: number; y: number; vx: number; vy: number; life: number; size: number };

type ShockwaveSpec = { born: number; strength: number };

type OrbitNode = { x: number; y: number; ring: number; blend: number; color: { r: number; g: number; b: number } };

const RINGS: RingSpec[] = [
  { radius: 0.24, speed: 0.34, tilt: 0.1, width: 1.25, hue: "gold" },
  { radius: 0.36, speed: 0.28, tilt: 0.14, width: 1.15, hue: "teal" },
  { radius: 0.5, speed: -0.17, tilt: -0.09, width: 1.45, hue: "gold" },
  { radius: 0.64, speed: 0.11, tilt: 0.06, width: 1.75, hue: "teal" },
  { radius: 0.76, speed: -0.07, tilt: 0.03, width: 2.1, hue: "gold" },
];

type Interaction = {
  tiltX: number;
  tiltY: number;
  targetTiltX: number;
  targetTiltY: number;
  pointerX: number;
  pointerY: number;
  hasPointer: boolean;
  spin: number;
  spinVel: number;
  dragging: boolean;
  lastX: number;
  activity: number;
  stardust: StardustSpec[];
  shockwaves: ShockwaveSpec[];
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(c: { r: number; g: number; b: number }, a: number) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function _easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

const ENTRY_MS = 1400;

/** Túnel de luz convergindo ao centro — fase 1 da entrada cinematográfica. */
function drawEntryWarpIn(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  base: number,
  strength: number,
  t: number,
  flatten: number,
) {
  if (strength <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const streaks = 32;
  for (let i = 0; i < streaks; i++) {
    const angle = (i / streaks) * Math.PI * 2 + t * 1.8;
    const outer = base * (0.55 + strength * 0.65);
    const inner = base * (0.02 + (1 - strength) * 0.06);
    const sx = cx + Math.cos(angle) * outer;
    const sy = cy + Math.sin(angle) * outer * flatten;
    const ex = cx + Math.cos(angle + 0.04) * inner;
    const ey = cy + Math.sin(angle + 0.04) * inner * flatten;
    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, `rgba(45, 212, 191, ${strength * 0.08})`);
    grad.addColorStop(0.4, `rgba(167, 139, 250, ${strength * 0.18})`);
    grad.addColorStop(0.75, `rgba(255, 255, 255, ${strength * 0.42})`);
    grad.addColorStop(1, `rgba(237, 228, 212, ${strength * 0.55})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.8 + strength * 2.4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  for (let i = 0; i < 14; i++) {
    const frac = i / 14;
    const r = base * (0.06 + frac * 0.72 * strength);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * flatten, t * 0.9 + frac * 0.35, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(250, 246, 238, ${(1 - frac) * strength * 0.32})`;
    ctx.lineWidth = 1.2 + (1 - frac) * 2.2 * strength;
    ctx.stroke();
  }

  const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.48 * strength);
  flash.addColorStop(0, `rgba(255, 255, 255, ${strength * 0.78})`);
  flash.addColorStop(0.12, `rgba(45, 212, 191, ${strength * 0.48})`);
  flash.addColorStop(0.32, `rgba(167, 139, 250, ${strength * 0.22})`);
  flash.addColorStop(0.55, `rgba(212, 196, 168, ${strength * 0.1})`);
  flash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = flash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Funil de luz em forma de ampulheta — referência SAMANA / warp scroll. */
function drawConvergenceFunnel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  strength: number,
  t: number,
) {
  if (strength <= 0.02) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const lanes = 14;
  for (let i = 0; i < lanes; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const lane = Math.floor(i / 2);
    const spread = w * (0.42 - lane * 0.025);
    const startY = side < 0 ? h * 0.08 : h * 0.92;
    const endY = cy + side * h * 0.04;
    ctx.beginPath();
    for (let j = 0; j <= 28; j++) {
      const f = j / 28;
      const ease = f * f * (3 - 2 * f);
      const x = cx + spread * (1 - ease) * (lane % 2 === 0 ? 1 : -1) + Math.sin(t * 2 + i + f * 6) * 8 * (1 - f);
      const y = startY + (endY - startY) * ease;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const alpha = strength * (0.12 + (1 - lane / lanes) * 0.22);
    ctx.strokeStyle = lane % 3 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(45,212,191,${alpha * 0.85})`;
    ctx.lineWidth = 0.7 + strength * 1.1;
    ctx.stroke();
  }
  ctx.restore();
}

/** Esfera de partículas onduladas — referência TEXTURA particle sphere. */
function _drawParticleSphere(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  alpha: number,
  spin: number,
  sparse: boolean,
) {
  if (alpha <= 0.015) return;
  const count = sparse ? 48 : 88;
  const radius = base * (0.22 + 0.04 * Math.sin(t * 0.7));
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i + spin * 0.6 + t * 0.35;
    const wobble = Math.sin(t * 2.4 + i * 0.31) * 0.08;
    const r = radius * (1 + wobble);
    const x3 = r * Math.sin(phi) * Math.cos(theta);
    const y3 = r * Math.sin(phi) * Math.sin(theta);
    const z3 = r * Math.cos(phi);
    const depth = 0.35 + (z3 / radius + 1) * 0.325;
    const px = cx + x3;
    const py = cy + y3 * 0.55;
    const hueT = (y3 / radius + 1) * 0.5;
    const col =
      hueT < 0.35
        ? TEAL
        : hueT < 0.65
          ? COGNITIVE
          : { r: 217, g: 119, b: 180 };
    const lineH = 8 + depth * 18;
    const wave = Math.sin(t * 3.2 + i * 0.42) * 3;
    const seg = 5;
    ctx.beginPath();
    for (let s = 0; s <= seg; s++) {
      const f = s / seg;
      const lx = px + Math.sin(t * 2 + i + f * 4) * wave * f;
      const ly = py - lineH * 0.5 + lineH * f;
      if (s === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.strokeStyle = rgba(col, alpha * depth * 0.55);
    ctx.lineWidth = 0.6 + depth * 0.8;
    ctx.stroke();
    ctx.fillStyle = rgba(col, alpha * depth * 0.75);
    ctx.beginPath();
    ctx.arc(px, py - lineH * 0.5, 0.8 + depth, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Malha wireframe ondulada na base — referência TEXTURA terrain wave. */
function _drawWireframeTerrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  reveal: number,
) {
  if (reveal <= 0.02) return;
  const cols = w < 768 ? 22 : 34;
  const rows = w < 768 ? 10 : 14;
  const horizon = h * (0.58 + (1 - reveal) * 0.22);
  const depth = h * 0.38 * reveal;
  const pts: { x: number; y: number; c: { r: number; g: number; b: number } }[][] = [];

  for (let r = 0; r <= rows; r++) {
    pts[r] = [];
    const rowT = r / rows;
    for (let c = 0; c <= cols; c++) {
      const colT = c / cols;
      const wx = colT * w;
      const wz = rowT;
      const wave =
        Math.sin(colT * 8 + t * 1.4) * 0.35 +
        Math.cos(rowT * 6 + t * 1.1) * 0.25 +
        Math.sin((colT + rowT) * 5 + t * 0.9) * 0.2;
      const persp = 0.25 + wz * 0.75;
      const py = horizon + wz * depth + wave * 28 * persp;
      const hueT = colT;
      const col =
        hueT < 0.33
          ? TEAL
          : hueT < 0.66
            ? COGNITIVE
            : { r: 251, g: 113, b: 133 };
      pts[r]![c] = { x: wx, y: py, c: col };
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = pts[r]![c]!;
      const b = pts[r]![c + 1]!;
      const d = pts[r + 1]?.[c];
      const alpha = reveal * 0.42 * (0.35 + (r / rows) * 0.65);
      ctx.strokeStyle = rgba(a.c, alpha);
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (d) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
    }
  }
  const floorGlow = ctx.createLinearGradient(0, horizon, 0, h);
  floorGlow.addColorStop(0, `rgba(45,212,191,${reveal * 0.06})`);
  floorGlow.addColorStop(0.5, `rgba(167,139,250,${reveal * 0.04})`);
  floorGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floorGlow;
  ctx.fillRect(0, horizon - 20, w, h - horizon + 20);
  ctx.restore();
}

/** Anéis galácticos que se materializam — referência TEXTURA galaxy rings. */
function _drawGalaxyRevealRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  reveal: number,
  t: number,
  flatten: number,
) {
  if (reveal <= 0.02) return;
  const rings = [
    { r: 0.38, hue: COGNITIVE, tilt: 0.12, w: 2.4 },
    { r: 0.52, hue: TEAL, tilt: -0.08, w: 3.2 },
    { r: 0.66, hue: GOLD_HOT, tilt: 0.05, w: 2.8 },
    { r: 0.78, hue: { r: 217, g: 119, b: 180 }, tilt: -0.04, w: 2.2 },
  ];
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i]!;
    const settle = easeOutCubic(clamp01((reveal - i * 0.12) / 0.72));
    const expand = 1 + (1 - settle) * 0.55;
    const r = ring.r * base * expand;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ring.tilt + t * (0.08 + i * 0.02) * (i % 2 === 0 ? 1 : -1));
    ctx.scale(1, flatten);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(ring.hue, settle * 0.55);
    ctx.lineWidth = ring.w * settle;
    ctx.shadowBlur = 18 * settle;
    ctx.shadowColor = rgba(ring.hue, 0.65);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.14 * reveal);
  core.addColorStop(0, `rgba(255,255,255,${reveal * 0.45})`);
  core.addColorStop(0.35, `rgba(45,212,191,${reveal * 0.22})`);
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, base * 0.14 * reveal, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEntryStarStreaks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  stars: StarSpec[],
  strength: number,
  _t: number,
) {
  if (strength <= 0.03) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const s of stars) {
    if (s.z < 0.4) continue;
    const sx = s.x * w;
    const sy = s.y * h;
    const dx = cx - sx;
    const dy = cy - sy;
    const len = Math.hypot(dx, dy) || 1;
    const streak = strength * s.z * 28;
    const ex = sx + (dx / len) * streak;
    const ey = sy + (dy / len) * streak;
    const col = s.phase % 2 < 1 ? TEAL : GOLD_HOT;
    ctx.strokeStyle = rgba(col, strength * s.z * 0.35);
    ctx.lineWidth = 0.5 + s.z * 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  t: number,
  introWake: number,
  sparse = false,
) {
  if (introWake < 0.65) return;
  const size = sparse ? 56 : 48;
  const alpha = 0.018 * introWake;
  const stepX = size * (sparse ? 2.4 : 1.75);
  const stepY = size * (sparse ? 2.1 : 1.52);
  ctx.save();
  ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
  ctx.lineWidth = 0.45;
  const offsetX = (t * 12) % size;
  const offsetY = (t * 8) % size;
  for (let x = -size; x < w + size; x += stepX) {
    for (let y = -size; y < h + size; y += stepY) {
      const px = x + offsetX + ((y / size) % 2) * (size * 0.875);
      const py = y + offsetY;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < Math.min(w, h) * 0.14) continue;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const hx = px + Math.cos(a) * size * 0.5;
        const hy = py + Math.sin(a) * size * 0.5;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMagneticField(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  intensity: number,
  flatten: number,
) {
  if (intensity < 0.06) return;
  for (let i = 0; i < 7; i++) {
    const a0 = (i / 7) * Math.PI * 2 + t * 0.22;
    ctx.beginPath();
    for (let j = 0; j <= 24; j++) {
      const f = j / 24;
      const r = base * (0.1 + f * 0.38);
      const curve = Math.sin(f * Math.PI * 3 + a0) * 0.22;
      const x = cx + Math.cos(a0 + curve) * r;
      const y = cy + Math.sin(a0 + curve) * r * flatten;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(167, 139, 250, ${0.035 * intensity})`;
    ctx.lineWidth = 0.65;
    ctx.stroke();
  }
}

function drawConstellationMesh(
  ctx: CanvasRenderingContext2D,
  nodes: OrbitNode[],
  cx: number,
  cy: number,
  introWake: number,
) {
  if (introWake < 0.55 || nodes.length < 2) return;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]!;
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]!;
      if (a.ring === b.ring) {
        ctx.strokeStyle = `rgba(212, 196, 168, ${0.04 * introWake})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      if (Math.abs(a.ring - b.ring) === 1 && (a.blend > 0.2 || b.blend > 0.2)) {
        const grad = ctx.createLinearGradient(a.x, a.y, cx, cy);
        grad.addColorStop(0, rgba(a.color, 0.12 * Math.max(a.blend, b.blend)));
        grad.addColorStop(1, rgba(TEAL, 0.04));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
    }
  }
}

function drawSingularityNoise(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  holeR: number,
  t: number,
  activity: number,
  samples = 32,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, holeR * 0.92, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2 + t * 1.6;
    const r = holeR * (0.15 + 0.65 * Math.abs(Math.sin(t * 2.8 + i * 0.7)));
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.45;
    const g = ctx.createRadialGradient(x, y, 0, x, y, holeR * 0.18);
    g.addColorStop(0, `rgba(45, 212, 191, ${0.08 + activity * 0.12})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - holeR, cy - holeR, holeR * 2, holeR * 2);
  }
  ctx.restore();
}

function drawLensFlares(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  activity: number,
  t: number,
) {
  if (activity < 0.25) return;
  const flares = [
    { x: cx + Math.cos(t * 0.4) * w * 0.32, y: cy + Math.sin(t * 0.35) * h * 0.18 },
    { x: cx - w * 0.28, y: cy - h * 0.12 },
    { x: cx + w * 0.22, y: cy + h * 0.26 },
  ];
  for (const f of flares) {
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 90);
    g.addColorStop(0, `rgba(237, 228, 212, ${0.06 * activity})`);
    g.addColorStop(0.5, `rgba(45, 212, 191, ${0.03 * activity})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(f.x - 100, f.y - 100, 200, 200);
  }
}

function drawWarpTunnel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  base: number,
  warpOut: number,
  t: number,
  flatten: number,
) {
  if (warpOut <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let s = 0; s < 24; s++) {
    const angle = (s / 24) * Math.PI * 2 + t * 2.4;
    const inner = base * 0.04;
    const outer = base * (0.18 + warpOut * 0.95);
    const sx = cx + Math.cos(angle) * inner;
    const sy = cy + Math.sin(angle) * inner * flatten;
    const ex = cx + Math.cos(angle) * outer;
    const ey = cy + Math.sin(angle) * outer * flatten;
    const streak = ctx.createLinearGradient(sx, sy, ex, ey);
    streak.addColorStop(0, `rgba(255, 255, 255, ${warpOut * 0.35})`);
    streak.addColorStop(0.35, `rgba(45, 212, 191, ${warpOut * 0.22})`);
    streak.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.strokeStyle = streak;
    ctx.lineWidth = 1 + warpOut * 2.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  for (let i = 0; i < 12; i++) {
    const frac = i / 12;
    const r = base * (0.08 + frac * 0.85 * warpOut);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * flatten, t * 0.6 + frac * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(250, 246, 238, ${(1 - frac) * warpOut * 0.28})`;
    ctx.lineWidth = 1.5 + (1 - frac) * 2.8 * warpOut;
    ctx.stroke();
  }
  const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.62 * warpOut);
  flash.addColorStop(0, `rgba(255, 255, 255, ${warpOut * 0.52})`);
  flash.addColorStop(0.2, `rgba(45, 212, 191, ${warpOut * 0.28})`);
  flash.addColorStop(0.45, `rgba(167, 139, 250, ${warpOut * 0.12})`);
  flash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = flash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawOrbitalLanes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  spin: number,
  tiltX: number,
  tiltY: number,
  introAlpha: number,
) {
  if (introAlpha < 0.15) return;
  const flatten = 0.38 + tiltY * 0.07;
  for (const ring of RINGS) {
    const r = ring.radius * base;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin * 0.12 + ring.tilt);
    ctx.scale(1 + tiltX * 0.04, flatten);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
    ctx.strokeStyle =
      ring.hue === "teal" ? `rgba(45, 212, 191, ${0.04 * introAlpha})` : `rgba(212, 196, 168, ${0.035 * introAlpha})`;
    ctx.lineWidth = 0.6;
    ctx.setLineDash([2, 14]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawCursorStardust(
  ctx: CanvasRenderingContext2D,
  particles: StardustSpec[],
  _t: number,
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.022;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    const alpha = p.life * 0.55;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    glow.addColorStop(0, `rgba(237, 228, 212, ${alpha})`);
    glow.addColorStop(0.5, `rgba(45, 212, 191, ${alpha * 0.45})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShockwaves(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  shockwaves: ShockwaveSpec[],
  now: number,
  flatten: number,
) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i]!;
    const age = (now - sw.born) * 0.001;
    if (age > 1.8) {
      shockwaves.splice(i, 1);
      continue;
    }
    const frac = age / 1.8;
    const r = base * (0.08 + frac * 0.55) * sw.strength;
    const alpha = (1 - frac) * 0.22 * sw.strength;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * flatten, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
    ctx.lineWidth = 1.4 + (1 - frac) * 2;
    ctx.stroke();
  }
}

function drawEnergyTether(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  cx: number,
  cy: number,
  color: { r: number; g: number; b: number },
  blend: number,
  t: number,
) {
  const mx = (ax + cx) / 2 + Math.sin(t * 2.5) * 12 * blend;
  const my = (ay + cy) / 2 + Math.cos(t * 2.2) * 8 * blend;
  const grad = ctx.createLinearGradient(ax, ay, cx, cy);
  grad.addColorStop(0, rgba(color, 0.65 * blend));
  grad.addColorStop(0.55, rgba(TEAL, 0.25 * blend));
  grad.addColorStop(1, rgba(GOLD_HOT, 0.35 * blend));

  ctx.strokeStyle = grad;
  ctx.lineWidth = 1 + blend * 1.4;
  ctx.shadowBlur = 12 * blend;
  ctx.shadowColor = rgba(color, 0.5);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, cx, cy);
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (let i = 0; i < 3; i++) {
    const pt = i / 2;
    const px = (1 - pt) * (1 - pt) * ax + 2 * (1 - pt) * pt * mx + pt * pt * cx;
    const py = (1 - pt) * (1 - pt) * ay + 2 * (1 - pt) * pt * my + pt * pt * cy;
    ctx.fillStyle = rgba(GOLD_HOT, 0.35 * blend);
    ctx.beginPath();
    ctx.arc(px, py, 1.2 + blend, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNebula(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  nebulae: NebulaSpec[],
  t: number,
  tiltX: number,
  tiltY: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  const base = Math.min(w, h);

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.95);
  bg.addColorStop(0, "#0c1218");
  bg.addColorStop(0.4, "#060a0f");
  bg.addColorStop(1, "#020203");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const nebulaTints = [
    ["rgba(45, 212, 191, 0.16)", "rgba(45, 212, 191, 0)"],
    ["rgba(167, 139, 250, 0.12)", "rgba(167, 139, 250, 0)"],
    ["rgba(212, 196, 168, 0.14)", "rgba(212, 196, 168, 0)"],
    ["rgba(56, 189, 248, 0.08)", "rgba(56, 189, 248, 0)"],
  ] as const;

  for (let i = 0; i < nebulae.length; i++) {
    const n = nebulae[i]!;
    const tint = nebulaTints[i % nebulaTints.length]!;
    const depth = n.depth ?? 1;
    const nx =
      cx +
      (n.x - 0.5) * base * (0.85 + depth * 0.08) +
      tiltX * base * 0.05 * depth +
      Math.cos(t * 0.07 + n.phase) * base * 0.028 * depth;
    const ny =
      cy +
      (n.y - 0.5) * base * (0.65 + depth * 0.06) +
      tiltY * base * 0.05 * depth +
      Math.sin(t * 0.06 + n.phase) * base * 0.022 * depth;
    const pulse = 0.82 + 0.18 * Math.sin(t * 0.4 + n.phase);
    const nr = n.r * base * pulse * (0.85 + depth * 0.12);
    const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
    g.addColorStop(0, tint[0]);
    g.addColorStop(0.45, tint[1]);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
  }

  drawDistantGalaxies(ctx, cx, cy, base, t, tiltX, tiltY);
}

function drawDistantGalaxies(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  tiltX: number,
  tiltY: number,
) {
  const galaxies = [
    { x: -0.38, y: -0.28, r: 0.12, rot: 0.4 },
    { x: 0.42, y: 0.32, r: 0.09, rot: -0.6 },
    { x: 0.08, y: -0.42, r: 0.07, rot: 1.1 },
  ] as const;

  for (const g of galaxies) {
    const gx = cx + g.x * base + tiltX * base * 0.02;
    const gy = cy + g.y * base + tiltY * base * 0.02;
    const gr = g.r * base * (0.95 + 0.05 * Math.sin(t * 0.5 + g.rot));

    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(g.rot + t * 0.02);
    ctx.scale(1, 0.35);

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, gr);
    glow.addColorStop(0, "rgba(167, 139, 250, 0.08)");
    glow.addColorStop(0.5, "rgba(45, 212, 191, 0.04)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, gr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(212, 196, 168, 0.06)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, gr * 1.4, gr * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stars: StarSpec[],
  t: number,
  tiltX: number,
  tiltY: number,
) {
  for (const s of stars) {
    const depth = s.z;
    const sx = (s.x + tiltX * 0.035 * depth) * w;
    const sy = (s.y + tiltY * 0.035 * depth) * h;
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.8 + s.phase));
    const alpha = tw * depth * 0.55;
    const size = s.size * (0.6 + depth * 0.8);
    const starColor = s.phase % 2 < 1 ? TEAL : GOLD_HOT;
    ctx.fillStyle = rgba(starColor, alpha);
    ctx.fillRect(sx, sy, size, size);
    if (depth > 0.75 && tw > 0.85) {
      ctx.fillStyle = rgba(starColor, alpha * 0.25);
      ctx.fillRect(sx - 1, sy, size + 2, size);
      ctx.fillRect(sx, sy - 1, size, size + 2);
    }
    if (depth > 0.88 && tw > 0.7) {
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 4);
      glow.addColorStop(0, rgba(starColor, alpha * 0.35));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, size * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDust(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dusts: DustSpec[],
  t: number,
  tiltX: number,
  tiltY: number,
  evolve = true,
) {
  for (const d of dusts) {
    if (evolve) {
      d.x += d.speed * (0.4 + d.z * 0.6);
      d.y += Math.sin(t * 0.3 + d.phase) * d.drift * 0.00028;
      if (d.x > 1.04) d.x = -0.04;
      if (d.y > 1.04) d.y = -0.04;
      if (d.y < -0.04) d.y = 1.04;
    }
    const px = (d.x + tiltX * 0.015 * d.z) * w;
    const py = (d.y + tiltY * 0.015 * d.z) * h;
    const a = 0.035 + 0.09 * d.z * (0.6 + 0.4 * Math.sin(t * 0.8 + d.phase));
    const rw = 10 + d.z * 20;
    const rh = 4 + d.z * 8;
    const g = ctx.createRadialGradient(px, py, 0, px, py, rw);
    g.addColorStop(0, `rgba(237, 228, 212, ${a})`);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, rw, rh, d.phase, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawInfallStreams(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  activity: number,
  tiltX: number,
  tiltY: number,
) {
  const holeR = base * 0.078;
  const streams = 6;
  for (let i = 0; i < streams; i++) {
    const baseAngle = (i / streams) * Math.PI * 2 + t * 0.25;
    ctx.beginPath();
    for (let j = 0; j <= 32; j++) {
      const frac = j / 32;
      const spiral = baseAngle - frac * 2.8;
      const r = holeR * (5.5 - frac * 4.8);
      const x = cx + Math.cos(spiral) * r * (1 + tiltX * 0.03);
      const y = cy + Math.sin(spiral) * r * (0.36 + tiltY * 0.03);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const alpha = 0.04 + activity * 0.07 + (0.02 * Math.sin(t * 3 + i));
    ctx.strokeStyle = i % 2 === 0 ? `rgba(45, 212, 191, ${alpha})` : `rgba(237, 228, 212, ${alpha * 0.85})`;
    ctx.lineWidth = 0.8 + activity * 0.5;
    ctx.stroke();
  }
}

function drawNuxPulseRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  activity: number,
) {
  if (activity < 0.06) return;
  const holeR = base * 0.092;
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.62 + i * 0.34) % 1;
    const r = holeR * (1.35 + phase * 2.6);
    const alpha = (1 - phase) * activity * 0.32;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.38, 0, 0, Math.PI * 2);
    ctx.strokeStyle = i % 2 === 0 ? `rgba(45, 212, 191, ${alpha})` : `rgba(237, 228, 212, ${alpha * 0.75})`;
    ctx.lineWidth = 1.4 + (1 - phase) * 1.2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = `rgba(45, 212, 191, ${alpha * 0.6})`;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawGravitationalArcs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  tiltX: number,
  tiltY: number,
  activity: number,
) {
  const holeR = base * 0.072;
  const arcCount = 10;
  for (let i = 0; i < arcCount; i++) {
    const startAngle = (i / arcCount) * Math.PI * 2 + t * 0.12 + tiltX * 0.08;
    ctx.beginPath();
    for (let j = 0; j <= 28; j++) {
      const frac = j / 28;
      const a = startAngle + frac * 1.35;
      const r = holeR * (1.65 + frac * 3.2);
      const x = cx + Math.cos(a) * r * (1 + tiltX * 0.04);
      const y = cy + Math.sin(a) * r * (0.36 + tiltY * 0.04);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const hue = i % 3 === 0 ? TEAL : i % 3 === 1 ? GOLD_HOT : COGNITIVE;
    ctx.strokeStyle = rgba(hue, 0.05 + activity * 0.12);
    ctx.lineWidth = 0.85 + activity * 0.55;
    ctx.stroke();
  }
}

function drawCrystalOrbitRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: { r: number; g: number; b: number },
  hovered: boolean,
  t: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation + t * 0.6);
  ctx.scale(1, 0.42);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 2.2, size * 2.2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(color, hovered ? 0.55 : 0.22);
  ctx.lineWidth = hovered ? 1.1 : 0.7;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCrystalParticles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  particles: CrystalParticleSpec[],
  color: { r: number; g: number; b: number },
  t: number,
  intensity: number,
) {
  if (intensity < 0.05) return;
  for (const p of particles) {
    p.angle += p.speed;
    const px = x + Math.cos(p.angle + t * 0.5) * p.radius * size;
    const py = y + Math.sin(p.angle + t * 0.5) * p.radius * size * 0.45;
    ctx.fillStyle = rgba(color, intensity * 0.65);
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTechCrystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: { r: number; g: number; b: number },
  t: number,
  hovered: boolean,
  particles: CrystalParticleSpec[],
) {
  const s = size * (hovered ? 1.32 : 1);
  const intensity = hovered ? 1 : 0.52;

  drawCrystalOrbitRing(ctx, x, y, s, rotation, color, hovered, t);
  drawCrystalParticles(ctx, x, y, s, particles, color, t, intensity);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation + t * 0.4);

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? s : s * 0.58;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.55;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(-s, -s, s, s);
  grad.addColorStop(0, rgba(color, hovered ? 0.92 : 0.58));
  grad.addColorStop(0.45, rgba(GOLD_HOT, hovered ? 0.62 : 0.32));
  grad.addColorStop(1, rgba(color, hovered ? 0.38 : 0.2));
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.45);
  }
  ctx.strokeStyle = rgba(GOLD_HOT, hovered ? 0.35 : 0.15);
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.strokeStyle = rgba(GOLD_HOT, hovered ? 0.85 : 0.62);
  ctx.lineWidth = hovered ? 1.5 : 1.05;
  ctx.shadowBlur = hovered ? 32 : 18;
  ctx.shadowColor = rgba(color, hovered ? 0.85 : 0.55);
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (hovered) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.75, 0, Math.PI * 2);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.75);
    halo.addColorStop(0, rgba(color, 0.42));
    halo.addColorStop(0.55, rgba(TEAL, 0.12));
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fill();
  }

  ctx.restore();
}

function drawAccretionDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  rot: number,
  t: number,
  tiltY: number,
  flatten: number,
  activity = 0,
) {
  const rx = base * 0.26 * (1 + tiltY * 0.04 + activity * 0.04);
  const ry = rx * (0.32 + flatten * 0.06);
  const segments = 140;
  const hotAngle = rot + t * 1.2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot * 0.15);
  ctx.scale(1, 0.36 + flatten * 0.05);

  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1.2) / segments) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    const doppler = 0.2 + 0.8 * Math.max(0, Math.cos(mid - hotAngle));
    const alpha = doppler * (0.62 + activity * 0.18);
    const segColor = doppler > 0.55 ? GOLD_HOT : doppler > 0.35 ? TEAL : GOLD;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, a0, a1);
    ctx.strokeStyle = rgba(segColor, alpha * (0.35 + doppler * 0.5));
    ctx.lineWidth = 2.5 + doppler * 5;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  ctx.restore();

  const bloom = ctx.createRadialGradient(cx, cy, rx * 0.15, cx, cy, rx * 1.8);
  bloom.addColorStop(0, "rgba(45, 212, 191, 0.16)");
  bloom.addColorStop(0.35, "rgba(212, 196, 168, 0.24)");
  bloom.addColorStop(0.7, "rgba(167, 139, 250, 0.1)");
  bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bloom;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.36 + flatten * 0.05);
  ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4);
  ctx.restore();
}

function drawEinsteinRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  rot: number,
  tiltY: number,
) {
  const r = base * 0.115;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot * 0.08);
  ctx.scale(1, 0.4 + tiltY * 0.04);
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(237, 228, 212, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.shadowBlur = 28;
  ctx.shadowColor = "rgba(212, 196, 168, 0.55)";
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  activity = 0,
  wakeScale = 1,
  noiseSamples = 32,
) {
  const holeR = base * 0.092 * wakeScale;
  const pulse = 1 + 0.04 * Math.sin(t * 2.1) + activity * 0.03;

  const outer = ctx.createRadialGradient(cx, cy, holeR * 0.5, cx, cy, holeR * 3.5 * pulse);
  outer.addColorStop(0, "rgba(0, 0, 0, 0)");
  outer.addColorStop(0.55, `rgba(45, 212, 191, ${0.28 + activity * 0.16})`);
  outer.addColorStop(0.72, `rgba(237, 228, 212, ${0.2 + activity * 0.1})`);
  outer.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(cx, cy, holeR * 3.5, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeR * 1.15);
  core.addColorStop(0, "#000000");
  core.addColorStop(0.72, "#020304");
  core.addColorStop(0.9, "rgba(212, 196, 168, 0.4)");
  core.addColorStop(1, "rgba(212, 196, 168, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, holeR * 1.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
  ctx.fillStyle = "#000000";
  ctx.fill();

  drawSingularityNoise(ctx, cx, cy, holeR, t, activity, noiseSamples);

  const ringPulse = 0.75 + 0.25 * Math.sin(t * 2.8) + activity * 0.12 + Math.sin(t * 1.8) * 0.04;

  for (let i = 0; i < 4; i++) {
    const flareAngle = t * 1.15 + (i * Math.PI * 2) / 4;
    const fx = cx + Math.cos(flareAngle) * holeR * 1.14;
    const fy = cy + Math.sin(flareAngle) * holeR * 0.46;
    const flare = ctx.createRadialGradient(fx, fy, 0, fx, fy, holeR * 0.35);
    flare.addColorStop(0, `rgba(255, 244, 220, ${0.35 * ringPulse})`);
    flare.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(fx, fy, holeR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, holeR * 1.05, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 244, 220, ${0.82 + 0.18 * ringPulse})`;
  ctx.lineWidth = Math.max(2, holeR * 0.11);
  ctx.shadowBlur = 42;
  ctx.shadowColor = "rgba(212, 196, 168, 0.95)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, holeR * 1.14, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(212, 196, 168, ${0.45 + 0.2 * ringPulse})`;
  ctx.lineWidth = Math.max(1.2, holeR * 0.055);
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(237, 228, 212, 0.5)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, holeR * 1.28, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(212, 196, 168, ${0.18 + 0.1 * ringPulse})`;
  ctx.lineWidth = Math.max(0.8, holeR * 0.035);
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Subtle chromatic lensing for a more physically plausible premium look.
  ctx.beginPath();
  ctx.arc(cx + holeR * 0.02, cy, holeR * 1.36, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 + 0.06 * ringPulse})`;
  ctx.lineWidth = Math.max(0.7, holeR * 0.03);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - holeR * 0.02, cy, holeR * 1.34, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(251, 191, 96, ${0.12 + 0.06 * ringPulse})`;
  ctx.lineWidth = Math.max(0.7, holeR * 0.03);
  ctx.stroke();

  for (let w = 0; w < 3; w++) {
    const warpR = holeR * (1.48 + w * 0.12);
    ctx.beginPath();
    ctx.ellipse(cx, cy, warpR, warpR * 0.38, t * 0.08 + w * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(167, 139, 250, ${(0.06 + activity * 0.05) / (w + 1)})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.beginPath();
  ctx.arc(cx + 1.5, cy, holeR * 1.06, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 + ringPulse * 0.05})`;
  ctx.lineWidth = Math.max(1, holeR * 0.08);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 1.5, cy, holeR * 1.06, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(251, 191, 96, ${0.08 + ringPulse * 0.05})`;
  ctx.lineWidth = Math.max(1, holeR * 0.08);
  ctx.stroke();
  ctx.restore();
}

function drawNuxCoreAura(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  t: number,
  strength: number,
) {
  if (strength <= 0.04) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const pulse = 0.88 + 0.12 * Math.sin(t * 2.4);
  const r = base * 0.34 * pulse * strength;
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  aura.addColorStop(0, `rgba(45, 212, 191, ${0.22 * strength})`);
  aura.addColorStop(0.35, `rgba(212, 196, 168, ${0.14 * strength})`);
  aura.addColorStop(0.65, `rgba(167, 139, 250, ${0.06 * strength})`);
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCinematicPostFX(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  base: number,
  activity: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const left = ctx.createLinearGradient(0, 0, w * 0.14, 0);
  left.addColorStop(0, `rgba(56, 189, 248, ${0.08 + activity * 0.05})`);
  left.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, w, h);
  const right = ctx.createLinearGradient(w, 0, w * 0.86, 0);
  right.addColorStop(0, `rgba(251, 191, 96, ${0.07 + activity * 0.04})`);
  right.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = right;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const vignette = ctx.createRadialGradient(cx, cy, base * 0.18, cx, cy, base * 1.12);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.68, "rgba(0,0,0,0.12)");
  vignette.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  if (w > 480 && h > 360) {
    ctx.save();
    ctx.globalAlpha = 0.028;
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }
}

function drawOrbitRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  ring: RingSpec,
  base: number,
  rot: number,
  tiltX: number,
  tiltY: number,
  t: number,
) {
  const r = ring.radius * base;
  const wobble = 0.38 + tiltY * 0.08;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot + ring.tilt + Math.sin(t * 0.3) * 0.02);
  ctx.scale(1 + tiltX * 0.05, wobble);

  const accent =
    ring.hue === "teal"
      ? ["rgba(45, 212, 191, 0)", "rgba(45, 212, 191, 0.35)", "rgba(56, 189, 248, 0.2)"]
      : ["rgba(212, 196, 168, 0)", "rgba(237, 228, 212, 0.35)", "rgba(212, 196, 168, 0.2)"];

  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(-r, 0, r, 0);
    if (pass === 0) {
      grad.addColorStop(0, accent[0]!);
      grad.addColorStop(0.35, accent[2]!);
      grad.addColorStop(0.5, accent[1]!);
      grad.addColorStop(0.65, accent[2]!);
      grad.addColorStop(1, accent[0]!);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ring.width + 4;
      ctx.globalAlpha = 0.58;
    } else {
      grad.addColorStop(0, accent[0]!);
      grad.addColorStop(0.5, accent[1]!);
      grad.addColorStop(1, accent[0]!);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ring.width;
      ctx.globalAlpha = 1;
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPhotons(
  ctx: CanvasRenderingContext2D,
  photons: PhotonSpec[],
  cx: number,
  cy: number,
  base: number,
  spin: number,
  tiltX: number,
  tiltY: number,
) {
  const flatten = 0.38 + tiltY * 0.06;
  for (const p of photons) {
    p.angle += p.speed;
    p.radius *= 0.9972;
    if (p.radius < 0.07) {
      p.radius = 0.48 + Math.random() * 0.15;
      p.angle = Math.random() * Math.PI * 2;
      p.trail = [];
      p.color = Math.random() > 0.45 ? TEAL : GOLD_HOT;
    }
    const pr = p.radius * base;
    const px = cx + Math.cos(p.angle + spin) * pr * (1 + tiltX * 0.04);
    const py = cy + Math.sin(p.angle + spin) * pr * flatten;

    p.trail.unshift({ x: px, y: py });
    if (p.trail.length > 10) p.trail.pop();

    for (let i = 1; i < p.trail.length; i++) {
      const prev = p.trail[i - 1]!;
      const curr = p.trail[i]!;
      const alpha = (1 - i / p.trail.length) * 0.45;
      ctx.strokeStyle = rgba(p.color, alpha);
      ctx.lineWidth = 1.6 - i * 0.1;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(p.color, 0.9);
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOfferings(
  ctx: CanvasRenderingContext2D,
  offerings: OfferingSpec[],
  cx: number,
  cy: number,
  base: number,
  spin: number,
  tiltX: number,
  tiltY: number,
  t: number,
  introAlpha: number,
  pointerX: number,
  pointerY: number,
  hasPointer: boolean,
): { tether: { ax: number; ay: number; blend: number; color: { r: number; g: number; b: number } } | null; nodes: OrbitNode[] } {
  const flatten = 0.38 + tiltY * 0.07;
  let activeTether: { ax: number; ay: number; blend: number; color: { r: number; g: number; b: number } } | null = null;
  const nodes: OrbitNode[] = [];

  for (const item of offerings) {
    const ring = RINGS[item.ring];
    if (!ring) continue;
    const r = ring.radius * base;
    const wob = Math.sin(t * 1.6 + item.wobble) * 0.02;
    const c = item.color;

    item.hoverBlend = Math.max(0, item.hoverBlend - 0.045);
    const speedMod = 1 - item.hoverBlend * 0.52;
    const angleAdjusted = item.phase + spin + t * ring.speed * speedMod + wob;
    const axSlow = cx + Math.cos(angleAdjusted) * r * (1 + tiltX * 0.05);
    const aySlow = cy + Math.sin(angleAdjusted) * r * flatten;

    const touchFriendly = base < 520;
    const hoverRadius = touchFriendly
      ? item.emphasis === "inner"
        ? 112
        : 96
      : item.emphasis === "inner"
        ? 92
        : 78;
    const hovered = hasPointer && Math.hypot(pointerX - axSlow, pointerY - aySlow) <= hoverRadius;
    if (hovered) item.hoverBlend = Math.min(1, item.hoverBlend + 0.09);
    if (item.hoverBlend > 0.08) {
      activeTether = { ax: axSlow, ay: aySlow, blend: item.hoverBlend, color: c };
    }
    nodes.push({ x: axSlow, y: aySlow, ring: item.ring, blend: item.hoverBlend, color: c });

    item.trail.unshift({ x: axSlow, y: aySlow });
    if (item.trail.length > 16) item.trail.pop();

    for (let i = 1; i < item.trail.length; i++) {
      const prev = item.trail[i - 1]!;
      const curr = item.trail[i]!;
      ctx.strokeStyle = rgba(c, (1 - i / item.trail.length) * 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(axSlow, aySlow, 0, axSlow, aySlow, hovered ? 38 : 28);
    glow.addColorStop(0, rgba(c, hovered ? 0.72 : 0.55));
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(axSlow, aySlow, hovered ? 38 : 28, 0, Math.PI * 2);
    ctx.fill();

    drawTechCrystal(
      ctx,
      axSlow,
      aySlow + 6,
      base * 0.017,
      item.phase + spin,
      c,
      t,
      hovered,
      item.crystalParticles,
    );

    const isInner = item.emphasis === "inner";
    const labelAlpha = introAlpha * (hovered ? 1 : isInner ? 0.82 : 0.68);

    ctx.save();
    ctx.globalAlpha *= labelAlpha;

    const fontSize = offerings.length > 7 ? 9 : isInner ? 10 : 9.5;
    const padX = 8;
    const pillH = 18;
    ctx.font = `600 ${fontSize}px var(--font-inter), system-ui, sans-serif`;
    const text = item.label;
    const tw = ctx.measureText(text).width;
    const pillW = Math.max(tw + padX * 2, 64);
    const px = axSlow - pillW / 2;
    const py = aySlow - 32;

    const glass = ctx.createLinearGradient(px, py, px + pillW, py + pillH);
    glass.addColorStop(0, rgba(c, hovered ? 0.28 : 0.16));
    glass.addColorStop(1, rgba(c, hovered ? 0.12 : 0.06));
    ctx.fillStyle = glass;
    ctx.strokeStyle = rgba(c, hovered ? 0.75 : isInner ? 0.62 : 0.48);
    ctx.lineWidth = hovered ? 1.2 : 0.9;
    ctx.beginPath();
    ctx.roundRect(px, py, pillW, pillH, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = rgba(GOLD_HOT, hovered ? 0.98 : 0.82);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = hovered ? 8 : 4;
    ctx.shadowColor = "rgba(0,0,0,0.75)";
    ctx.fillText(text, axSlow, py + pillH / 2);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  return { tether: activeTether, nodes };
}

function drawStaticScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offerings: OfferingSpec[],
  nebulae: NebulaSpec[],
  stars: StarSpec[],
  dusts: DustSpec[],
) {
  drawNebula(ctx, w, h, nebulae, 0, 0, 0);
  drawStars(ctx, w, h, stars, 0, 0, 0);
  drawDust(ctx, w, h, dusts, 0, 0, 0, false);
  const cx = w / 2;
  const cy = h / 2;
  const base = Math.min(w, h);
  for (const ring of RINGS) drawOrbitRing(ctx, cx, cy, ring, base, 0, 0, 0, 0);
  drawAccretionDisk(ctx, cx, cy, base, 0, 0, 0, 0.38, 0);
  drawEinsteinRing(ctx, cx, cy, base, 0, 0);
  drawGravitationalArcs(ctx, cx, cy, base, 0, 0, 0, 0);
  drawBlackHole(ctx, cx, cy, base, 0, 0);
  drawOfferings(ctx, offerings, cx, cy, base, 0, 0, 0, 0, 1, cx, cy, false);
}

export type IntroOffering = {
  label: string;
  description?: string;
  colorIndex: number;
  ring?: number;
  emphasis?: OfferingEmphasis;
  sublabel?: string;
  phase?: number;
};

export function PronuxIntroCosmos({
  offerings,
  className,
  warpOut = 0,
}: {
  offerings: IntroOffering[];
  className?: string;
  /** 0–1 cinematic warp tunnel during intro exit. */
  warpOut?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const warpOutRef = useRef(warpOut);
  const warpKickRef = useRef<(() => void) | null>(null);
  const reduceMotion = useReducedMotion();
  const introStartRef = useRef<number | null>(null);
  const entryBurstRef = useRef(false);
  const interactionRef = useRef<Interaction>({
    tiltX: 0,
    tiltY: 0,
    targetTiltX: 0,
    targetTiltY: 0,
    pointerX: 0,
    pointerY: 0,
    hasPointer: false,
    spin: 0,
    spinVel: 0,
    dragging: false,
    lastX: 0,
    activity: 0,
    stardust: [],
    shockwaves: [],
  });
  const offeringsRef = useRef<OfferingSpec[]>([]);

  useEffect(() => {
    const rand = mulberry32(0x70726f);
    offeringsRef.current = offerings.map((item, i) => {
      const prand = mulberry32(0x6372 + i);
      return {
        label: item.label,
        sublabel: item.sublabel,
        description: item.description,
        ring: item.ring ?? (i % RINGS.length),
        phase: item.phase ?? rand() * Math.PI * 2,
        color: OFFERING_COLORS[item.colorIndex % OFFERING_COLORS.length]!,
        wobble: rand() * Math.PI * 2,
        emphasis: item.emphasis ?? "standard",
        hoverBlend: 0,
        crystalParticles: Array.from({ length: 5 }, () => ({
          angle: prand() * Math.PI * 2,
          radius: 1.8 + prand() * 1.4,
          speed: 0.008 + prand() * 0.012,
          size: 0.6 + prand() * 0.8,
        })),
        trail: [],
      };
    });
  }, [offerings]);

  useEffect(() => {
    warpOutRef.current = warpOut;
    warpKickRef.current?.();
  }, [warpOut]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let frameCount = 0;
    let tabVisible = true;
    let stars: StarSpec[] = [];
    let photons: PhotonSpec[] = [];
    let dusts: DustSpec[] = [];
    let nebulae: NebulaSpec[] = [];
    const rand = mulberry32(42);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const area = rect.width * rect.height;
      const isMobileViewport = rect.width < 768;
      const dpr = isMobileViewport
        ? Math.min(window.devicePixelRatio || 1, 1.5)
        : Math.min(Math.max(window.devicePixelRatio || 1, 1.25), 1.75);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isMobile = rect.width < 768;
      const starCount = Math.floor(area / (isMobile ? 3600 : 2400));
      const dustCount = Math.floor(area / (isMobile ? 16000 : 22000));
      const photonCount = Math.floor(area / (isMobile ? 70000 : 110000)) + (isMobile ? 32 : 64);

      stars = Array.from({ length: Math.min(starCount, isMobile ? 720 : 1400) }, () => ({
        x: rand(),
        y: rand(),
        z: 0.15 + rand() * 0.85,
        phase: rand() * Math.PI * 2,
        size: 0.55 + rand() * 1.25,
      }));
      dusts = Array.from({ length: Math.min(dustCount, 620) }, () => ({
        x: rand() * 1.1 - 0.05,
        y: rand() * 1.1 - 0.05,
        z: 0.25 + rand() * 0.75,
        phase: rand() * Math.PI * 2,
        speed: 0.00005 + rand() * 0.00018,
        drift: 0.5 + rand() * 1.1,
      }));
      photons = Array.from({ length: Math.min(photonCount, isMobile ? 72 : 140) }, () => ({
        angle: rand() * Math.PI * 2,
        radius: 0.12 + rand() * 0.42,
        speed: 0.0012 + rand() * 0.002,
        color: rand() > 0.45 ? TEAL : GOLD_HOT,
        trail: [],
      }));
      nebulae = [
        { x: 0.28, y: 0.35, r: 0.42, phase: rand() * 6, depth: 1.1 },
        { x: 0.72, y: 0.62, r: 0.38, phase: rand() * 6, depth: 0.9 },
        { x: 0.55, y: 0.22, r: 0.3, phase: rand() * 6, depth: 1.2 },
        { x: 0.15, y: 0.68, r: 0.34, phase: rand() * 6, depth: 0.85 },
        { x: 0.82, y: 0.28, r: 0.26, phase: rand() * 6, depth: 1.05 },
        { x: 0.4, y: 0.78, r: 0.22, phase: rand() * 6, depth: 0.75 },
      ];
    };

    const draw = (time: number) => {
      if (!tabVisible) {
        raf = requestAnimationFrame(draw);
        return;
      }

      frameCount += 1;
      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w < 2 || h < 2) return;

      const state = interactionRef.current;
      const t = time * 0.001;
      const warp = Math.min(1, Math.max(0, warpOutRef.current));
      const warpSpinBoost = 1 + warp * 4;

      state.spin += state.spinVel * warpSpinBoost;
      state.spinVel *= 0.965 * (1 - warp * 0.08);
      state.activity *= 0.965;

      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h);
      const pointerX = state.pointerX;
      const pointerY = state.pointerY;
      const hasPointer = state.hasPointer;

      const distToCenter = hasPointer ? Math.hypot(pointerX - cx, pointerY - cy) / base : 1;
      const proximity = Math.max(0, 1 - distToCenter * 1.6);
      const activity = Math.min(1, state.activity + proximity * 0.35 + Math.abs(state.spinVel) * 3);

      state.tiltX += (state.targetTiltX - state.tiltX) * (0.06 + activity * 0.02);
      state.tiltY += (state.targetTiltY - state.tiltY) * (0.06 + activity * 0.02);

      const tiltX = state.tiltX * 0.42;
      const tiltY = state.tiltY * 0.34;
      const spin = state.spin;

      if (introStartRef.current === null) introStartRef.current = time;
      const entryElapsed = time - introStartRef.current;
      const entryRaw = reduceMotion ? 1 : Math.min(1, entryElapsed / ENTRY_MS);
      const entryProgress = easeOutCubic(entryRaw);
      const entryActive = entryRaw < 1;

      const warpIn = entryActive ? clamp01(1 - entryProgress * 1.35) : 0;
      const funnelStrength = entryActive ? clamp01(Math.sin(entryProgress * Math.PI) * 0.85) : 0;
      const cosmosBlend = entryActive ? easeOutCubic(clamp01((entryProgress - 0.1) / 0.38)) : 1;

      const introAlpha = reduceMotion
        ? 1
        : Math.min(1, Math.max(0, (entryElapsed - ENTRY_MS * 0.28) / 360));
      const introWake = reduceMotion
        ? 1
        : easeOutCubic(Math.min(1, Math.max(0, (entryElapsed - ENTRY_MS * 0.22) / 640)));
      const wakeScale = (0.72 + introWake * 0.28) * (entryActive ? 0.88 + entryProgress * 0.12 : 1);
      const cameraZoom = entryActive ? 1.75 - entryProgress * 0.75 : 1;
      const cameraDriftY = entryActive ? (1 - entryProgress) * h * 0.035 : 0;

      const flatten = 0.38 + tiltY * 0.07;
      const isMobile = w < 768;
      const quality =
        entryActive && entryProgress < 0.42 ? 0 : introWake < 0.38 ? 0 : introWake < 0.72 ? 1 : isMobile ? 1 : 2;
      const fxBoost = activity + warp * 0.5;

      if (!entryBurstRef.current && entryRaw >= 0.52) {
        entryBurstRef.current = true;
        state.shockwaves.push({ born: time, strength: 0.95 });
      }

      drawNebula(ctx, w, h, nebulae, t, tiltX, tiltY);

      if (entryActive && warpIn > 0.04) {
        drawEntryStarStreaks(ctx, w, h, cx, cy, stars, warpIn, t);
      }

      drawStars(ctx, w, h, stars, t, tiltX, tiltY);

      if (entryActive) {
        drawEntryWarpIn(ctx, w, h, cx, cy - cameraDriftY, base, warpIn, t, flatten);
        drawConvergenceFunnel(ctx, w, h, cx, cy - cameraDriftY, funnelStrength, t);
      }

      ctx.save();
      ctx.translate(cx, cy + cameraDriftY * 0.35);
      ctx.scale(cameraZoom, cameraZoom);
      ctx.translate(-cx, -cy);

      if (quality >= 2 && frameCount % 4 === 0) {
        drawHexGrid(ctx, w, h, cx, cy, t, introWake * cosmosBlend * (1 - warp * 0.6), true);
      }
      if (quality >= 1) drawDust(ctx, w, h, dusts, t, tiltX, tiltY);

      const ringAlpha = cosmosBlend * (1 - warp * 0.25);
      for (const ring of RINGS) {
        const rot = spin * 0.45 + t * ring.speed;
        ctx.save();
        ctx.globalAlpha = ringAlpha;
        drawOrbitRing(ctx, cx, cy, ring, base, rot, tiltX, tiltY, t);
        ctx.restore();
      }

      if (quality >= 1) {
        drawPhotons(ctx, photons, cx, cy, base, spin, tiltX, tiltY);
        drawInfallStreams(ctx, cx, cy, base, t, activity * introWake * cosmosBlend * (1 + warp), tiltX, tiltY);
      }
      if (quality >= 2 && fxBoost > 0.08) {
        drawMagneticField(ctx, cx, cy, base, t, fxBoost + Math.abs(state.spinVel) * 3, flatten);
      }
      drawAccretionDisk(
        ctx,
        cx,
        cy,
        base,
        spin,
        t,
        tiltY,
        tiltY,
        activity * introWake * cosmosBlend * (1 + warp * 0.5),
      );
      if (quality >= 2) {
        drawOrbitalLanes(ctx, cx, cy, base, spin, tiltX, tiltY, introAlpha * introWake * cosmosBlend * (1 - warp * 0.5));
      }

      const { tether, nodes } = drawOfferings(
        ctx,
        offeringsRef.current,
        cx,
        cy,
        base,
        spin,
        tiltX,
        tiltY,
        t,
        introAlpha * introWake * cosmosBlend * (1 - warp * 0.35),
        pointerX,
        pointerY,
        hasPointer,
      );

      if (quality >= 2 && introWake > 0.82) {
        drawConstellationMesh(ctx, nodes, cx, cy, introWake * cosmosBlend * (1 - warp));
      }

      if (tether) {
        drawEnergyTether(ctx, tether.ax, tether.ay, cx, cy, tether.color, tether.blend * (1 - warp * 0.3), t);
      }

      drawEinsteinRing(ctx, cx, cy, base, spin, tiltY);
      if (quality >= 1) {
        drawGravitationalArcs(
          ctx,
          cx,
          cy,
          base,
          t,
          tiltX,
          tiltY,
          activity * introWake * cosmosBlend * (0.55 + warp * 0.35),
        );
        drawNuxPulseRings(ctx, cx, cy, base, t, activity * introWake * cosmosBlend + warp * 0.6);
      }
      drawShockwaves(ctx, cx, cy, base, state.shockwaves, time, flatten);
      drawBlackHole(
        ctx,
        cx,
        cy,
        base,
        t,
        activity * introWake * cosmosBlend + warp * 0.55,
        wakeScale * (1 + warp * 0.22),
        quality >= 2 ? 20 : 10,
      );
      drawNuxCoreAura(
        ctx,
        cx,
        cy,
        base,
        t,
        introWake * cosmosBlend * (0.65 + activity * 0.35),
      );
      if (quality >= 1) drawCursorStardust(ctx, state.stardust, t);
      if (quality >= 2 && fxBoost > 0.2) {
        drawLensFlares(ctx, w, h, cx, cy, fxBoost, t);
      }

      ctx.restore();

      drawWarpTunnel(ctx, w, h, cx, cy, base, warp, t, flatten);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const bloom = ctx.createRadialGradient(cx, cy, base * 0.05, cx, cy, base * 0.55);
      bloom.addColorStop(0, `rgba(45, 212, 191, ${0.07 + activity * 0.07})`);
      bloom.addColorStop(0.45, `rgba(212, 196, 168, ${0.045 + activity * 0.045})`);
      bloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      drawCinematicPostFX(ctx, w, h, cx, cy, base, activity * introWake);

      if (frameCount % 18 === 0) {
        window.dispatchEvent(
          new CustomEvent("pronux-cosmos-telemetry", {
            detail: {
              activity: Math.round(activity * 100),
              spin: Math.abs(state.spinVel * 1000).toFixed(1),
              services: offeringsRef.current.length,
              warp,
            },
          }),
        );
      }

      if (frameCount % 12 === 0) {
        const phase =
          entryRaw < 0.32
            ? "warp"
            : entryRaw < 0.55
              ? "form"
              : entryRaw < 0.78
                ? "reveal"
                : "ready";
        window.dispatchEvent(
          new CustomEvent("pronux-cosmos-entry", {
            detail: { progress: entryRaw, phase, ready: entryRaw >= 0.48 },
          }),
        );
      }

      raf = requestAnimationFrame(draw);
    };

    const syncPointer = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const state = interactionRef.current;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      state.pointerX = e.clientX - rect.left;
      state.pointerY = e.clientY - rect.top;
      state.hasPointer = true;
      state.targetTiltX = (nx - 0.5) * 2;
      state.targetTiltY = (ny - 0.5) * 2;
      state.activity = Math.min(1, state.activity + 0.035);
    };

    const onPointerDown = (e: PointerEvent) => {
      const state = interactionRef.current;
      state.dragging = true;
      state.lastX = e.clientX;
      syncPointer(e);
      wrap.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = interactionRef.current;
      syncPointer(e);

      if (Math.random() > 0.78) {
        state.stardust.push({
          x: state.pointerX,
          y: state.pointerY,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          life: 0.55 + Math.random() * 0.45,
          size: 0.7 + Math.random() * 1.1,
        });
        if (state.stardust.length > 72) state.stardust.shift();
      }

      if (state.dragging) {
        const dx = e.clientX - state.lastX;
        const spinGain = wrap.clientWidth < 768 ? 0.0088 : 0.0055;
        state.spinVel += dx * spinGain;
        state.lastX = e.clientX;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const state = interactionRef.current;
      state.dragging = false;
      state.shockwaves.push({
        born: performance.now(),
        strength: Math.min(1.5, 0.55 + Math.abs(state.spinVel) * 10),
      });
      if (state.shockwaves.length > 5) state.shockwaves.shift();
      try {
        wrap.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerLeave = () => {
      interactionRef.current.hasPointer = false;
    };

    resize();

    const paintStatic = (time: number) => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 2 || h < 2) return;
      drawStaticScene(ctx, w, h, offeringsRef.current, nebulae, stars, dusts);
      const warp = Math.min(1, Math.max(0, warpOutRef.current));
      if (warp > 0.01) {
        const cx = w / 2;
        const cy = h / 2;
        const base = Math.min(w, h);
        const t = time * 0.001;
        drawWarpTunnel(ctx, w, h, cx, cy, base, warp, t, 0.38);
        drawLensFlares(ctx, w, h, cx, cy, warp * 0.55, t);
      }
    };

    if (reduceMotion) {
      let staticRaf = 0;
      const staticLoop = (time: number) => {
        paintStatic(time);
        if (warpOutRef.current > 0 && warpOutRef.current < 1) {
          staticRaf = requestAnimationFrame(staticLoop);
        }
      };
      warpKickRef.current = () => {
        if (warpOutRef.current <= 0) return;
        cancelAnimationFrame(staticRaf);
        staticRaf = requestAnimationFrame(staticLoop);
      };

      paintStatic(performance.now());
      const ro = new ResizeObserver(() => {
        resize();
        paintStatic(performance.now());
      });
      ro.observe(wrap);
      wrap.addEventListener("pointerdown", onPointerDown);
      wrap.addEventListener("pointermove", onPointerMove);
      wrap.addEventListener("pointerup", onPointerUp);
      wrap.addEventListener("pointercancel", onPointerUp);
      wrap.addEventListener("pointerleave", onPointerLeave);
      return () => {
        warpKickRef.current = null;
        cancelAnimationFrame(staticRaf);
        ro.disconnect();
        wrap.removeEventListener("pointerdown", onPointerDown);
        wrap.removeEventListener("pointermove", onPointerMove);
        wrap.removeEventListener("pointerup", onPointerUp);
        wrap.removeEventListener("pointercancel", onPointerUp);
        wrap.removeEventListener("pointerleave", onPointerLeave);
      };
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      wrap.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "absolute inset-0 touch-none select-none",
        "cursor-grab active:cursor-grabbing",
        className,
      )}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
