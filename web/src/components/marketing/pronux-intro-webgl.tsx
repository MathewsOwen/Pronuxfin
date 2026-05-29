"use client";

import { useReducedMotion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField } from "@react-three/postprocessing";
import { Stars } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { computeBudgetedDpr } from "@/components/marketing/intro-mobile";
import { cn } from "@/lib/utils";
import {
  coreGlowFragment,
  coreGlowVertex,
  fluidFragment,
  fluidVertex,
  infinityTrailFragment,
  infinityTrailVertex,
  sphereLineFragment,
  sphereLineVertex,
  terrainFragment,
  terrainVertex,
  warpParticleFragment,
  warpParticleVertex,
  waterFragment,
  waterVertex,
} from "@/components/marketing/pronux-intro-webgl-shaders";
import { ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import {
  buildCameraPath,
  DataCascade,
  DnaHelix,
  HolographicNux,
  IgnitionShockwaves,
  NeuralCortex,
  SingularityShell,
} from "@/components/marketing/pronux-intro-webgl-apex";

export const PRONUX_CINEMATIC_ENTRY_MS = 4500;
const ENTRY_MS = PRONUX_CINEMATIC_ENTRY_MS;
const GOLD = new THREE.Color(0xd4c4a8);
const TEAL = new THREE.Color(0x2dd4bf);
const COGNITIVE = new THREE.Color(0xa78bfa);
const OFFERING_COLORS = [
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

const RING_RADII = [0.24, 0.36, 0.5, 0.64, 0.76];

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type EntryState = {
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

function computeEntry(elapsed: number, reduceMotion: boolean): EntryState {
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
    funnel: raw < 1 ? clamp01(Math.sin(progress * Math.PI) * 0.9) : 0,
    sphere: raw < 1 ? clamp01(Math.sin(progress * Math.PI * 1.05) * (1 - progress * 0.35)) : 0,
    terrain: raw < 1 ? easeInOutCubic(clamp01((progress - 0.28) / 0.55)) : 0,
    galaxy: raw < 1 ? easeOutCubic(clamp01((progress - 0.22) / 0.62)) : 0,
    cosmos: raw < 1 ? easeOutCubic(clamp01((progress - 0.48) / 0.52)) : 1,
    phase: raw < 0.24 ? "warp" : raw < 0.52 ? "form" : raw < 0.86 ? "reveal" : "ready",
  };
}

function buildWarpParticles(count: number) {
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

function buildSphereLines(count: number, sparse: boolean) {
  const segments = sparse ? 4 : 6;
  const vertCount = count * (segments + 1);
  const positions = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);
  const phases = new Float32Array(vertCount);
  let vi = 0;
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 1.65;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    const hueT = (y / r + 1) * 0.5;
    const col = new THREE.Color();
    if (hueT < 0.35) col.lerpColors(TEAL, COGNITIVE, hueT / 0.35);
    else col.lerpColors(COGNITIVE, new THREE.Color(0xd9778e), (hueT - 0.35) / 0.65);
    const lineH = 0.35 + ((z / r + 1) * 0.5) * 0.55;
    for (let s = 0; s <= segments; s++) {
      const f = s / segments;
      positions[vi * 3] = x + Math.sin(i * 0.42) * 0.04 * f;
      positions[vi * 3 + 1] = y - lineH * 0.5 + lineH * f;
      positions[vi * 3 + 2] = z;
      colors[vi * 3] = col.r;
      colors[vi * 3 + 1] = col.g;
      colors[vi * 3 + 2] = col.b;
      phases[vi] = i * 0.31;
      vi++;
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const base = i * (segments + 1);
    for (let s = 0; s < segments; s++) indices.push(base + s, base + s + 1);
  }
  return { positions, colors, phases, indices };
}

function buildFluidParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 1.2 + Math.random() * 2.8;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
    positions[i * 3 + 2] = r * Math.cos(phi);
    seeds[i * 3] = Math.random() * 10;
    seeds[i * 3 + 1] = Math.random() * 10;
    seeds[i * 3 + 2] = Math.random() * 10;
    sizes[i] = 2 + Math.random() * 5;
  }
  return { positions, seeds, sizes };
}

function figureEightPoint(t: number): THREE.Vector3 {
  const a = 1.45;
  const angle = t * Math.PI * 2;
  return new THREE.Vector3(
    a * Math.sin(angle),
    a * Math.sin(angle) * Math.cos(angle),
    Math.sin(angle * 2) * 0.28,
  );
}

function buildFigureEightCurve() {
  const pts = Array.from({ length: 128 }, (_, i) => figureEightPoint(i / 128));
  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
}

function FluidNebula({
  entryRef,
  warpOutRef,
}: {
  entryRef: React.RefObject<EntryState>;
  warpOutRef: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Points>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isMobile ? 900 : 2200;
  const data = useMemo(() => buildFluidParticles(count), [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
        vertexShader: fluidVertex,
        fragmentShader: fluidFragment,
      }),
    [],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const entry = entryRef.current;
    const fluidPhase = clamp01(Math.sin(entry.progress * Math.PI) * 1.1);
    const alpha =
      fluidPhase * 0.85 * entry.cosmos +
      warpOutRef.current * 0.35 +
      entry.funnel * 0.25;
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uAlpha!.value = alpha;
    ref.current.visible = alpha > 0.04;
    ref.current.rotation.y = state.clock.elapsedTime * 0.06;
  });

  return (
    <points ref={ref} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
      </bufferGeometry>
      <primitive object={mat} attach="material" />
    </points>
  );
}

function InfinityLoop({
  entryRef,
  warpOutRef,
}: {
  entryRef: React.RefObject<EntryState>;
  warpOutRef: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const curve = useMemo(() => buildFigureEightCurve(), []);
  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 200, 0.018, 8, true), [curve]);
  const trailGeo = useMemo(() => {
    const pts = curve.getPoints(240);
    const positions = new Float32Array(pts.length * 3);
    const along = new Float32Array(pts.length);
    pts.forEach((p: THREE.Vector3, i: number) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      along[i] = i / pts.length;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
    return g;
  }, [curve]);
  const trailMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
        vertexShader: infinityTrailVertex,
        fragmentShader: infinityTrailFragment,
      }),
    [],
  );
  const trailLine = useMemo(() => new THREE.Line(trailGeo, trailMat), [trailGeo, trailMat]);

  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    g.add(trailLine);
    return () => {
      g.remove(trailLine);
    };
  }, [trailLine]);

  useFrame((state) => {
    if (!group.current) return;
    const alpha =
      easeOutCubic(entryRef.current.cosmos) * 0.9 +
      warpOutRef.current * 0.25;
    group.current.visible = alpha > 0.08;
    group.current.rotation.z = state.clock.elapsedTime * 0.12;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    trailMat.uniforms.uTime!.value = state.clock.elapsedTime;
    trailMat.uniforms.uAlpha!.value = alpha;
    group.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat.opacity !== undefined) mat.opacity = alpha * 0.55;
    });
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={tubeGeo}>
        <meshBasicMaterial color={TEAL} transparent opacity={0} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function WaterPlane({ entryRef }: { entryRef: React.RefObject<EntryState> }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
      }),
    [],
  );

  useFrame((state) => {
    const reveal = easeOutCubic(entryRef.current.cosmos) * 0.85;
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uReveal!.value = reveal;
    if (ref.current) ref.current.visible = reveal > 0.06;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]} visible={false}>
      <planeGeometry args={[16, 16, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function NuxMonogram3D({
  entryRef,
  warpOutRef,
}: {
  entryRef: React.RefObject<EntryState>;
  warpOutRef: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const bars = useMemo(
    () =>
      [
        { x: -0.14, h: 0.14 },
        { x: -0.05, h: 0.21 },
        { x: 0.05, h: 0.28 },
        { x: 0.14, h: 0.34 },
      ] as const,
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const alpha = easeOutCubic(clamp01((entryRef.current.cosmos - 0.35) / 0.65));
    const boost = 1 + warpOutRef.current * 0.35;
    group.current.visible = alpha > 0.05;
    group.current.scale.setScalar(0.6 + alpha * 0.4);
    group.current.rotation.y = state.clock.elapsedTime * 0.25;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
    group.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat?.opacity !== undefined) mat.opacity = alpha * boost * 0.9;
    });
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <torusGeometry args={[0.42, 0.028, 24, 96]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} blending={THREE.AdditiveBlending} />
      </mesh>
      {bars.map((bar) => (
        <mesh key={bar.x} position={[bar.x, -bar.h * 0.5 + 0.02, 0.06]}>
          <boxGeometry args={[0.045, bar.h, 0.045]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 48]} />
        <meshBasicMaterial color={TEAL} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function WarpTunnel({
  entryRef,
  warpOutRef,
}: {
  entryRef: React.RefObject<EntryState>;
  warpOutRef: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Points>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isMobile ? 1200 : 2800;
  const data = useMemo(() => buildWarpParticles(count), [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uStrength: { value: 0 },
        },
        vertexShader: warpParticleVertex,
        fragmentShader: warpParticleFragment,
      }),
    [],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const strength = Math.max(entryRef.current.warpIn, warpOutRef.current * 0.95);
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uStrength!.value = strength;
    ref.current.visible = strength > 0.02;
  });

  return (
    <points ref={ref} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aSpeed" args={[data.speeds, 1]} />
        <bufferAttribute attach="attributes-aOffset" args={[data.offsets, 1]} />
      </bufferGeometry>
      <primitive object={mat} attach="material" />
    </points>
  );
}

function ParticleSphere({ entryRef }: { entryRef: React.RefObject<EntryState> }) {
  const ref = useRef<THREE.LineSegments>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isMobile ? 64 : 120;
  const geo = useMemo(() => {
    const built = buildSphereLines(count, isMobile);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(built.positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(built.colors, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(built.phases, 1));
    g.setIndex(built.indices);
    return g;
  }, [count, isMobile]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
        vertexShader: sphereLineVertex,
        fragmentShader: sphereLineFragment,
      }),
    [],
  );

  useFrame((state) => {
    const alpha = entryRef.current.sphere;
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uAlpha!.value = alpha;
    if (ref.current) ref.current.visible = alpha > 0.02;
  });

  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false} visible={false}>
      <primitive object={mat} attach="material" />
    </lineSegments>
  );
}

function GalaxyRings({ entryRef }: { entryRef: React.RefObject<EntryState> }) {
  const group = useRef<THREE.Group>(null);
  const rings = useMemo(
    () => [
      { r: 2.4, color: COGNITIVE, tilt: 0.35, speed: 0.08 },
      { r: 3.1, color: TEAL, tilt: -0.22, speed: -0.06 },
      { r: 3.8, color: GOLD, tilt: 0.15, speed: 0.05 },
      { r: 4.4, color: new THREE.Color(0xd9778e), tilt: -0.1, speed: -0.04 },
    ],
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const reveal = entryRef.current.galaxy;
    const settle = easeOutCubic(reveal);
    group.current.visible = reveal > 0.02;
    group.current.scale.setScalar(0.5 + settle * 0.5);
    group.current.children.forEach((child, i) => {
      child.rotation.x = rings[i]!.tilt + state.clock.elapsedTime * rings[i]!.speed;
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = settle * 0.85;
    });
  });

  return (
    <group ref={group} visible={false}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[ring.tilt, 0, 0]}>
          <torusGeometry args={[ring.r, 0.025 + i * 0.008, 16, 128]} />
          <meshBasicMaterial color={ring.color} transparent opacity={0} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

function WaveTerrain({ entryRef }: { entryRef: React.RefObject<EntryState> }) {
  const ref = useRef<THREE.Mesh>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        wireframe: true,
        transparent: true,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
        vertexShader: terrainVertex,
        fragmentShader: terrainFragment,
      }),
    [],
  );

  useFrame((state) => {
    const entry = entryRef.current;
    const reveal = entry.terrain * (1 - entry.cosmos * 0.55);
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uReveal!.value = reveal * (1 - clamp01(reveal) * 0.35);
    if (ref.current) ref.current.visible = reveal > 0.03;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -2.8, 0]} visible={false}>
      <planeGeometry args={[14, 10, isMobile ? 32 : 48, isMobile ? 24 : 36]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function NuxCore({
  entryRef,
  warpOutRef,
}: {
  entryRef: React.RefObject<EntryState>;
  warpOutRef: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const disk = useRef<THREE.Mesh>(null);
  const diskMat = useRef<THREE.MeshBasicMaterial>(null);
  const outerMat = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: {
          uIntensity: { value: 0 },
          uColor: { value: new THREE.Color(0x2dd4bf) },
        },
        vertexShader: coreGlowVertex,
        fragmentShader: coreGlowFragment,
      }),
    [],
  );

  useFrame((state) => {
    const visible = entryRef.current.cosmos;
    const intensity = visible + warpOutRef.current * 0.5;
    glowMat.uniforms.uIntensity!.value = intensity * 1.2;
    if (group.current) {
      group.current.visible = visible > 0.05;
      group.current.scale.setScalar(visible);
    }
    if (disk.current) disk.current.rotation.z = state.clock.elapsedTime * 0.35;
    if (diskMat.current) diskMat.current.opacity = 0.75 * intensity;
    if (outerMat.current) outerMat.current.opacity = 0.45 * intensity;
    if (light.current) light.current.intensity = intensity * 4;
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      <mesh ref={disk} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[0.55, 0.04, 16, 96]} />
        <meshBasicMaterial
          ref={diskMat}
          color={GOLD}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[0.72, 0.025, 12, 96]} />
        <meshBasicMaterial
          ref={outerMat}
          color={TEAL}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={light} color={TEAL} intensity={0} distance={8} decay={2} />
    </group>
  );
}

type OfferingSpec = {
  ring: number;
  phase: number;
  color: THREE.Color;
};

function OrbitCrystals({
  offerings,
  entryRef,
  warpOutRef,
  interactionRef,
}: {
  offerings: OfferingSpec[];
  entryRef: React.RefObject<EntryState>;
  warpOutRef: React.RefObject<number>;
  interactionRef: React.RefObject<{ spin: number }>;
}) {
  const group = useRef<THREE.Group>(null);
  const crystalRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    if (!group.current) return;
    const alpha = entryRef.current.cosmos * (1 - warpOutRef.current * 0.4);
    const spin = interactionRef.current.spin;
    group.current.visible = alpha > 0.08;
    group.current.rotation.y = spin + state.clock.elapsedTime * 0.04;
    offerings.forEach((item, i) => {
      const mesh = crystalRefs.current[i];
      if (!mesh) return;
      const r = RING_RADII[item.ring % RING_RADII.length]! * 5.2;
      const angle = item.phase + spin + state.clock.elapsedTime * 0.04;
      mesh.position.set(Math.cos(angle) * r, Math.sin(angle * 2) * 0.12, Math.sin(angle) * r);
      mesh.rotation.set(angle, angle * 0.5, 0);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = alpha * 0.9;
    });
  });

  return (
    <group ref={group} visible={false}>
      {offerings.map((item, i) => (
        <mesh
          key={i}
          ref={(el) => {
            crystalRefs.current[i] = el;
          }}
        >
          <octahedronGeometry args={[0.12, 0]} />
          <meshBasicMaterial color={item.color} transparent opacity={0} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

function ConvergenceLines({ entryRef }: { entryRef: React.RefObject<EntryState> }) {
  const ref = useRef<THREE.Group>(null);
  const linePointCount = 25;
  const lines = useMemo(() => {
    const items: THREE.Line[] = [];
    const seed = Array.from({ length: linePointCount }, () => new THREE.Vector3());
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints(seed);
      const mat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xffffff : 0x2dd4bf,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      items.push(new THREE.Line(geo, mat));
    }
    return items;
  }, []);

  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    for (const line of lines) g.add(line);
    return () => {
      for (const line of lines) g.remove(line);
    };
  }, [lines]);

  useFrame((state) => {
    if (!ref.current) return;
    const strength = entryRef.current.funnel;
    ref.current.visible = strength > 0.02;
    if (strength <= 0.02) return;
    const t = state.clock.elapsedTime;
    lines.forEach((line, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const lane = Math.floor(i / 2);
      const spread = 5 - lane * 0.35;
      const start = new THREE.Vector3(spread * side, side < 0 ? 6 : -6, -2);
      const end = new THREE.Vector3(0, 0, 0);
      const mid = start.clone().lerp(end, 0.5);
      mid.x += Math.sin(t * 2 + i) * 0.3;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(linePointCount - 1);
      const positions = line.geometry.attributes.position as THREE.BufferAttribute;
      for (let j = 0; j < pts.length; j++) {
        positions.setXYZ(j, pts[j]!.x, pts[j]!.y, pts[j]!.z);
      }
      positions.needsUpdate = true;
      const mat = line.material as THREE.LineBasicMaterial;
      mat.opacity = strength * (0.15 + (1 - lane / 8) * 0.25);
    });
  });

  return <group ref={ref} visible={false} />;
}

function SceneContent({
  offerings,
  warpOutRef,
  reduceMotion,
  interactionRef,
}: {
  offerings: OfferingSpec[];
  warpOutRef: React.RefObject<number>;
  reduceMotion: boolean;
  interactionRef: React.RefObject<{
    spin: number;
    spinVel: number;
    tiltX: number;
    tiltY: number;
    targetTiltX: number;
    targetTiltY: number;
    activity: number;
    dragging: boolean;
    lastX: number;
  }>;
}) {
  const startRef = useRef(performance.now());
  const entryRef = useRef<EntryState>(computeEntry(0, reduceMotion));
  const frameCount = useRef(0);
  const world = useRef<THREE.Group>(null);
  const cameraPath = useMemo(() => buildCameraPath(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  useFrame((state, delta) => {
    frameCount.current += 1;
    const elapsed = reduceMotion ? ENTRY_MS : performance.now() - startRef.current;
    const entry = computeEntry(elapsed, reduceMotion);
    entryRef.current = entry;

    const inter = interactionRef.current;
    const warpOut = warpOutRef.current;
    inter.spin += inter.spinVel;
    inter.spinVel *= 0.965 * (1 - warpOut * 0.08);
    inter.activity *= 0.965;
    inter.tiltX += (inter.targetTiltX - inter.tiltX) * 0.06;
    inter.tiltY += (inter.targetTiltY - inter.tiltY) * 0.06;

    if (world.current) {
      world.current.rotation.x = inter.tiltY * 0.18;
      world.current.rotation.z = inter.tiltX * 0.12;
    }

    const pathT = easeOutCubic(entry.progress);
    const pathPos = cameraPath.getPointAt(pathT);
    const pathLook = cameraPath.getPointAt(clamp01(pathT + 0.04));
    lookTarget.set(pathLook.x + inter.tiltX * 0.25, pathLook.y + inter.tiltY * 0.18, pathLook.z);
    const warpPull = warpOut * 6;
    pathPos.z -= warpPull;
    pathPos.y += warpOut * 0.9;
    camera.position.lerp(pathPos, 1 - Math.pow(0.0008, delta));
    camera.lookAt(lookTarget);

    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      const targetFov = 48 + warpOut * 22 - entry.warpIn * 12 + Math.sin(pathT * Math.PI) * 4;
      persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, 0.06);
      persp.updateProjectionMatrix();
    }

    if (frameCount.current % 12 === 0) {
      window.dispatchEvent(
        new CustomEvent("pronux-cosmos-entry", {
          detail: { progress: entry.raw, phase: entry.phase, ready: entry.raw >= 0.86 },
        }),
      );
    }
    if (frameCount.current % 18 === 0) {
      window.dispatchEvent(
        new CustomEvent("pronux-cosmos-telemetry", {
          detail: {
            activity: Math.round((inter.activity + entry.cosmos * 0.35) * 100),
            spin: Math.abs(inter.spinVel * 1000).toFixed(1),
            services: offerings.length,
            warp: warpOut,
          },
        }),
      );
    }
  });

  return (
    <>
      <color attach="background" args={["#030508"]} />
      <fog attach="fog" args={["#030508", 8, 22]} />
      <ambientLight intensity={0.15} />
      <Stars radius={80} depth={40} count={reduceMotion ? 800 : 2400} factor={3} saturation={0.15} fade speed={0.4} />

      <WarpTunnel entryRef={entryRef} warpOutRef={warpOutRef} />
      <ConvergenceLines entryRef={entryRef} />
      <DataCascade entryRef={entryRef} />
      <ParticleSphere entryRef={entryRef} />
      <DnaHelix entryRef={entryRef} />
      <GalaxyRings entryRef={entryRef} />
      <FluidNebula entryRef={entryRef} warpOutRef={warpOutRef} />
      <InfinityLoop entryRef={entryRef} warpOutRef={warpOutRef} />
      <NeuralCortex entryRef={entryRef} />

      <group ref={world}>
        <WaterPlane entryRef={entryRef} />
        <WaveTerrain entryRef={entryRef} />
        <SingularityShell entryRef={entryRef} warpOutRef={warpOutRef} />
        <NuxCore entryRef={entryRef} warpOutRef={warpOutRef} />
        <NuxMonogram3D entryRef={entryRef} warpOutRef={warpOutRef} />
        <Suspense fallback={null}>
          <HolographicNux entryRef={entryRef} warpOutRef={warpOutRef} />
        </Suspense>
        <IgnitionShockwaves entryRef={entryRef} warpOutRef={warpOutRef} />
        <OrbitCrystals
          offerings={offerings}
          entryRef={entryRef}
          warpOutRef={warpOutRef}
          interactionRef={interactionRef}
        />
      </group>
      {!reduceMotion ? <PostFX warpOutRef={warpOutRef} entryRef={entryRef} /> : null}
    </>
  );
}

function PostFX({
  warpOutRef,
  entryRef,
}: {
  warpOutRef: React.RefObject<number>;
  entryRef: React.RefObject<EntryState>;
}) {
  const [fx, setFx] = useState({ bloom: 1.75, chroma: 0.0008 });
  const frame = useRef(0);

  useFrame(() => {
    frame.current += 1;
    if (frame.current % 4 !== 0) return;
    const warp = warpOutRef.current;
    const cosmos = entryRef.current.cosmos;
    setFx({
      bloom: 1.75 + cosmos * 0.65 + warp * 1.35,
      chroma: warp * 0.006 + entryRef.current.warpIn * 0.002,
    });
  });

  const chromaOffset = useMemo(
    () => new THREE.Vector2(fx.chroma, fx.chroma * 0.75),
    [fx.chroma],
  );

  return (
    <EffectComposer multisampling={0}>
      <DepthOfField focusDistance={0.014} focalLength={0.024} bokehScale={3.2} height={480} />
      <Bloom
        luminanceThreshold={0.06}
        luminanceSmoothing={0.78}
        intensity={fx.bloom}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={chromaOffset}
        radialModulation={false}
        modulationOffset={0.5}
      />
      <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.1} darkness={0.82} />
    </EffectComposer>
  );
}

export type IntroOffering = {
  label: string;
  description?: string;
  colorIndex: number;
  ring?: number;
  emphasis?: "core" | "inner" | "standard";
  sublabel?: string;
  phase?: number;
};

export function PronuxIntroWebGL({
  offerings,
  className,
  warpOut = 0,
}: {
  offerings: IntroOffering[];
  className?: string;
  warpOut?: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef({
    spin: 0,
    spinVel: 0,
    tiltX: 0,
    tiltY: 0,
    targetTiltX: 0,
    targetTiltY: 0,
    activity: 0,
    dragging: false,
    lastX: 0,
  });

  const warpOutRef = useRef(warpOut);
  useEffect(() => {
    warpOutRef.current = warpOut;
  }, [warpOut]);

  const offeringSpecs = useMemo<OfferingSpec[]>(
    () =>
      offerings.map((item, i) => ({
        ring: item.ring ?? i % RING_RADII.length,
        phase: item.phase ?? i * 0.628,
        color: OFFERING_COLORS[item.colorIndex % OFFERING_COLORS.length]!,
      })),
    [offerings],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduceMotion) return;

    const syncPointer = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const state = interactionRef.current;
      state.targetTiltX = (nx - 0.5) * 2;
      state.targetTiltY = (ny - 0.5) * 2;
      state.activity = Math.min(1, state.activity + 0.035);
    };

    const onDown = (e: PointerEvent) => {
      interactionRef.current.dragging = true;
      interactionRef.current.lastX = e.clientX;
      syncPointer(e);
      wrap.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      syncPointer(e);
      const state = interactionRef.current;
      if (state.dragging) {
        const dx = e.clientX - state.lastX;
        const gain = wrap.clientWidth < 768 ? 0.0088 : 0.0055;
        state.spinVel += dx * gain;
        state.lastX = e.clientX;
      }
    };

    const onUp = (e: PointerEvent) => {
      interactionRef.current.dragging = false;
      try {
        wrap.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    return () => {
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
    };
  }, [reduceMotion]);

  const [dpr, setDpr] = useState<number>(() =>
    typeof window === "undefined"
      ? 1.5
      : computeBudgetedDpr(window.innerWidth, window.innerHeight),
  );

  useEffect(() => {
    let raf = 0;
    const recompute = () => {
      raf = 0;
      setDpr(computeBudgetedDpr(window.innerWidth, window.innerHeight));
    };
    const onResize = () => {
      if (!raf) raf = window.requestAnimationFrame(recompute);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

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
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 2.2, 12], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            offerings={offeringSpecs}
            warpOutRef={warpOutRef}
            reduceMotion={reduceMotion}
            interactionRef={interactionRef}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
