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
] as const;

type RingSpec = { radius: number; speed: number; tilt: number; width: number; hue: "gold" | "teal" };

type OfferingEmphasis = "core" | "inner" | "standard";

type OfferingSpec = {
  label: string;
  sublabel?: string;
  ring: number;
  phase: number;
  color: { r: number; g: number; b: number };
  wobble: number;
  emphasis: OfferingEmphasis;
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

type NebulaSpec = { x: number; y: number; r: number; phase: number };

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
    ["rgba(45, 212, 191, 0.14)", "rgba(45, 212, 191, 0)"],
    ["rgba(167, 139, 250, 0.1)", "rgba(167, 139, 250, 0)"],
    ["rgba(212, 196, 168, 0.12)", "rgba(212, 196, 168, 0)"],
  ] as const;

  for (let i = 0; i < nebulae.length; i++) {
    const n = nebulae[i]!;
    const tint = nebulaTints[i % nebulaTints.length]!;
    const nx =
      cx +
      (n.x - 0.5) * base * 0.9 +
      tiltX * base * 0.04 +
      Math.cos(t * 0.07 + n.phase) * base * 0.025;
    const ny =
      cy +
      (n.y - 0.5) * base * 0.7 +
      tiltY * base * 0.04 +
      Math.sin(t * 0.06 + n.phase) * base * 0.02;
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.4 + n.phase);
    const nr = n.r * base * pulse;
    const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
    g.addColorStop(0, tint[0]);
    g.addColorStop(0.45, tint[1]);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
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

function drawAccretionDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  base: number,
  rot: number,
  t: number,
  tiltY: number,
  flatten: number,
) {
  const rx = base * 0.2 * (1 + tiltY * 0.04);
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
    const alpha = doppler * 0.55;
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
  bloom.addColorStop(0, "rgba(45, 212, 191, 0.1)");
  bloom.addColorStop(0.35, "rgba(212, 196, 168, 0.16)");
  bloom.addColorStop(0.7, "rgba(167, 139, 250, 0.06)");
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

function drawBlackHole(ctx: CanvasRenderingContext2D, cx: number, cy: number, base: number, t: number) {
  const holeR = base * 0.072;
  const pulse = 1 + 0.04 * Math.sin(t * 2.1);

  const outer = ctx.createRadialGradient(cx, cy, holeR * 0.5, cx, cy, holeR * 3.5 * pulse);
  outer.addColorStop(0, "rgba(0, 0, 0, 0)");
  outer.addColorStop(0.55, "rgba(45, 212, 191, 0.2)");
  outer.addColorStop(0.72, "rgba(237, 228, 212, 0.14)");
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

  const ringPulse = 0.75 + 0.25 * Math.sin(t * 2.8);

  for (let i = 0; i < 3; i++) {
    const flareAngle = t * 1.15 + (i * Math.PI * 2) / 3;
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
  ctx.strokeStyle = `rgba(255, 244, 220, ${0.7 + 0.2 * ringPulse})`;
  ctx.lineWidth = Math.max(1.8, holeR * 0.1);
  ctx.shadowBlur = 32;
  ctx.shadowColor = "rgba(212, 196, 168, 0.85)";
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
      ctx.globalAlpha = 0.4;
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
) {
  const flatten = 0.38 + tiltY * 0.07;

  for (const item of offerings) {
    const ring = RINGS[item.ring];
    if (!ring) continue;
    const r = ring.radius * base;
    const wob = Math.sin(t * 1.6 + item.wobble) * 0.02;
    const angle = item.phase + spin + t * ring.speed + wob;
    const ax = cx + Math.cos(angle) * r * (1 + tiltX * 0.05);
    const ay = cy + Math.sin(angle) * r * flatten;
    const c = item.color;
    const hoverRadius = item.emphasis === "inner" ? 80 : 64;
    const hovered = hasPointer && Math.hypot(pointerX - ax, pointerY - ay) <= hoverRadius;

    item.trail.unshift({ x: ax, y: ay });
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

    const glow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 28);
    glow.addColorStop(0, rgba(c, 0.55));
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ax, ay, 28, 0, Math.PI * 2);
    ctx.fill();

    const isCore = item.emphasis === "core";
    const isInner = item.emphasis === "inner";
    const localAlpha =
      introAlpha *
      (isCore ? 1 : hovered ? 1 : isInner ? 0.78 + 0.2 * introAlpha : 0.72 + 0.2 * introAlpha);

    ctx.save();
    ctx.globalAlpha *= localAlpha;

    const fontSize = isCore ? 11 : isInner ? 10.5 : 10;
    const padX = isCore ? 11 : 9;
    const pillH = item.sublabel ? (isCore ? 32 : 28) : isCore ? 22 : 18;

    ctx.font = `600 ${fontSize}px var(--font-inter), system-ui, sans-serif`;
    const text = item.label;
    const tw = ctx.measureText(text).width;
    const pillW = Math.max(tw + padX * 2, isCore ? 108 : 72);
    const px = ax - pillW / 2;
    const py = ay - (isInner || isCore ? 34 : 28);

    const glass = ctx.createLinearGradient(px, py, px + pillW, py + pillH);
    glass.addColorStop(0, rgba(c, isCore ? 0.32 : 0.2));
    glass.addColorStop(1, rgba(c, isCore ? 0.14 : 0.08));
    ctx.fillStyle = glass;
    ctx.strokeStyle = isCore
      ? `rgba(255, 244, 220, ${0.75 + 0.15 * Math.sin(t * 2.2 + item.wobble)})`
      : rgba(c, isInner ? 0.78 : 0.58);
    ctx.lineWidth = isCore ? 1.6 : 1;
    ctx.beginPath();
    ctx.roundRect(px, py, pillW, pillH, isCore ? 11 : 9);
    ctx.fill();
    ctx.stroke();

    if (isCore) {
      ctx.strokeStyle = "rgba(212, 196, 168, 0.25)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(px - 3, py - 3, pillW + 6, pillH + 6, 13);
      ctx.stroke();
    }

    const textAlpha = hovered ? 0.98 : isInner ? 0.8 : 0.76;
    ctx.fillStyle = isCore ? `rgba(255, 248, 235, ${textAlpha})` : rgba(GOLD_HOT, textAlpha);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = isCore ? 10 : 6;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.fillText(text, ax, item.sublabel ? py + pillH * 0.38 : py + pillH / 2);

    if (item.sublabel) {
      ctx.font = `500 ${fontSize - 1.5}px var(--font-inter), system-ui, sans-serif`;
      ctx.fillStyle = rgba(GOLD, hovered ? 0.9 : 0.68);
      ctx.shadowBlur = 4;
      ctx.fillText(item.sublabel, ax, py + pillH * 0.72);
    }
    ctx.shadowBlur = 0;

    const dotR = isCore ? 4.5 : isInner ? 4 : 3.5;
    ctx.beginPath();
    ctx.arc(ax, ay - (isCore ? 10 : 8), dotR, 0, Math.PI * 2);
    ctx.fillStyle = rgba(isCore ? GOLD_HOT : c, hovered ? 1 : 0.62);
    ctx.fill();
    if (isCore) {
      ctx.strokeStyle = "rgba(255, 244, 220, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
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
  drawAccretionDisk(ctx, cx, cy, base, 0, 0, 0, 0.38);
  drawEinsteinRing(ctx, cx, cy, base, 0, 0);
  drawBlackHole(ctx, cx, cy, base, 0);
  drawOfferings(ctx, offerings, cx, cy, base, 0, 0, 0, 0, 1, cx, cy, false);
}

export type IntroOffering = {
  label: string;
  colorIndex: number;
  ring?: number;
  emphasis?: OfferingEmphasis;
  sublabel?: string;
  phase?: number;
};

export function PronuxIntroCosmos({
  offerings,
  className,
}: {
  offerings: IntroOffering[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const introStartRef = useRef<number | null>(null);
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
  });
  const offeringsRef = useRef<OfferingSpec[]>([]);

  useEffect(() => {
    const rand = mulberry32(0x70726f);
    offeringsRef.current = offerings.map((item, i) => ({
      label: item.label,
      sublabel: item.sublabel,
      ring: item.ring ?? (i % RINGS.length),
      phase: item.phase ?? rand() * Math.PI * 2,
      color: OFFERING_COLORS[item.colorIndex % OFFERING_COLORS.length]!,
      wobble: rand() * Math.PI * 2,
      emphasis: item.emphasis ?? "standard",
      trail: [],
    }));
  }, [offerings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let stars: StarSpec[] = [];
    let photons: PhotonSpec[] = [];
    let dusts: DustSpec[] = [];
    let nebulae: NebulaSpec[] = [];
    const rand = mulberry32(42);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const area = rect.width * rect.height;
      // 4K locked profile: keep high pixel density and heavy scene budget.
      const dpr = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isMobile = rect.width < 768;
      const starCount = Math.floor(area / (isMobile ? 2200 : 1500));
      const dustCount = Math.floor(area / (isMobile ? 12000 : 18000));
      const photonCount = Math.floor(area / (isMobile ? 50000 : 90000)) + (isMobile ? 48 : 96);

      stars = Array.from({ length: Math.min(starCount, isMobile ? 1400 : 2600) }, () => ({
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
      photons = Array.from({ length: Math.min(photonCount, isMobile ? 120 : 220) }, () => ({
        angle: rand() * Math.PI * 2,
        radius: 0.12 + rand() * 0.42,
        speed: 0.0012 + rand() * 0.002,
        color: rand() > 0.45 ? TEAL : GOLD_HOT,
        trail: [],
      }));
      nebulae = [
        { x: 0.28, y: 0.35, r: 0.42, phase: rand() * 6 },
        { x: 0.72, y: 0.62, r: 0.38, phase: rand() * 6 },
        { x: 0.55, y: 0.22, r: 0.3, phase: rand() * 6 },
      ];
    };

    const draw = (time: number) => {
      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w < 2 || h < 2) return;

      const state = interactionRef.current;
      const t = time * 0.001;

      state.tiltX += (state.targetTiltX - state.tiltX) * 0.06;
      state.tiltY += (state.targetTiltY - state.tiltY) * 0.06;
      state.spin += state.spinVel;
      state.spinVel *= 0.965;

      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h);
      const tiltX = state.tiltX * 0.42;
      const tiltY = state.tiltY * 0.34;
      const spin = state.spin;
      const pointerX = state.pointerX;
      const pointerY = state.pointerY;
      const hasPointer = state.hasPointer;

      drawNebula(ctx, w, h, nebulae, t, tiltX, tiltY);
      drawStars(ctx, w, h, stars, t, tiltX, tiltY);
      drawDust(ctx, w, h, dusts, t, tiltX, tiltY);

      for (const ring of RINGS) {
        const rot = spin * 0.45 + t * ring.speed;
        drawOrbitRing(ctx, cx, cy, ring, base, rot, tiltX, tiltY, t);
      }

      drawPhotons(ctx, photons, cx, cy, base, spin, tiltX, tiltY);
      drawAccretionDisk(ctx, cx, cy, base, spin, t, tiltY, tiltY);
      if (introStartRef.current === null) introStartRef.current = time;
      const introAlpha = reduceMotion
        ? 1
        : Math.min(1, Math.max(0, (time - introStartRef.current) / 950));

      drawOfferings(
        ctx,
        offeringsRef.current,
        cx,
        cy,
        base,
        spin,
        tiltX,
        tiltY,
        t,
        introAlpha,
        pointerX,
        pointerY,
        hasPointer,
      );
      drawEinsteinRing(ctx, cx, cy, base, spin, tiltY);
      drawBlackHole(ctx, cx, cy, base, t);

      const vignette = ctx.createRadialGradient(cx, cy, base * 0.24, cx, cy, base * 1.05);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.75, "rgba(0,0,0,0.08)");
      vignette.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    const onPointerDown = (e: PointerEvent) => {
      const state = interactionRef.current;
      state.dragging = true;
      state.lastX = e.clientX;
      wrap.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const state = interactionRef.current;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      state.pointerX = e.clientX - rect.left;
      state.pointerY = e.clientY - rect.top;
      state.hasPointer = true;
      state.targetTiltX = (nx - 0.5) * 2;
      state.targetTiltY = (ny - 0.5) * 2;

      if (state.dragging) {
        const dx = e.clientX - state.lastX;
        state.spinVel += dx * 0.0055;
        state.lastX = e.clientX;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      interactionRef.current.dragging = false;
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

    if (reduceMotion) {
      drawStaticScene(
        ctx,
        wrap.clientWidth,
        wrap.clientHeight,
        offeringsRef.current,
        nebulae,
        stars,
        dusts,
      );
      const ro = new ResizeObserver(() => {
        resize();
        drawStaticScene(
          ctx,
          wrap.clientWidth,
          wrap.clientHeight,
          offeringsRef.current,
          nebulae,
          stars,
          dusts,
        );
      });
      ro.observe(wrap);
      wrap.addEventListener("pointerdown", onPointerDown);
      wrap.addEventListener("pointermove", onPointerMove);
      wrap.addEventListener("pointerup", onPointerUp);
      wrap.addEventListener("pointercancel", onPointerUp);
      wrap.addEventListener("pointerleave", onPointerLeave);
      return () => {
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
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
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
