"use client";

import { useFrame } from "@react-three/fiber";
import { Text3D, Center } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  cortexPulseFragment,
  cortexPulseVertex,
  dataStreamFragment,
  dataStreamVertex,
  dnaFragment,
  dnaVertex,
  shockwaveFragment,
  shockwaveVertex,
  singularityFragment,
  singularityVertex,
} from "@/components/marketing/pronux-intro-webgl-shaders";

const TEAL = new THREE.Color(0x2dd4bf);
const GOLD = new THREE.Color(0xd4c4a8);
const COGNITIVE = new THREE.Color(0xa78bfa);
const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json";

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

type EntryRef = React.RefObject<{
  raw: number;
  progress: number;
  warpIn: number;
  funnel: number;
  sphere: number;
  terrain: number;
  galaxy: number;
  cosmos: number;
  phase: string;
}>;

function buildDnaHelix(strands: number, pointsPerStrand: number) {
  const positions = new Float32Array(strands * pointsPerStrand * 3);
  const colors = new Float32Array(strands * pointsPerStrand * 3);
  const phases = new Float32Array(strands * pointsPerStrand);
  let idx = 0;
  for (let s = 0; s < strands; s++) {
    const phaseOff = s * Math.PI;
    const col = s === 0 ? TEAL : COGNITIVE;
    for (let i = 0; i < pointsPerStrand; i++) {
      const t = (i / pointsPerStrand) * Math.PI * 5 - Math.PI * 0.5;
      const radius = 0.55 + Math.sin(t * 0.8) * 0.08;
      const y = t * 0.38;
      const ang = t + phaseOff;
      positions[idx * 3] = Math.cos(ang) * radius;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = Math.sin(ang) * radius;
      colors[idx * 3] = col.r;
      colors[idx * 3 + 1] = col.g;
      colors[idx * 3 + 2] = col.b;
      phases[idx] = i * 0.17 + s;
      idx++;
    }
  }
  return { positions, colors, phases, count: strands * pointsPerStrand };
}

function buildDataStreams(count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const offsets = new Float32Array(count);
  const lanes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    speeds[i] = 0.12 + Math.random() * 0.22;
    offsets[i] = Math.random();
    lanes[i] = Math.random();
  }
  return { positions, speeds, offsets, lanes };
}

function buildCortexGraph(nodeCount: number) {
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 2.8 + Math.random() * 1.8;
    nodes.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.55,
        r * Math.cos(phi),
      ),
    );
  }
  const positions = new Float32Array(nodeCount * 3);
  const colors = new Float32Array(nodeCount * 3);
  const pulses = new Float32Array(nodeCount);
  const lineIndices: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    positions[i * 3] = nodes[i]!.x;
    positions[i * 3 + 1] = nodes[i]!.y;
    positions[i * 3 + 2] = nodes[i]!.z;
    const mix = i / nodeCount;
    const c = new THREE.Color().lerpColors(TEAL, GOLD, mix);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    pulses[i] = Math.random();
    for (let j = i + 1; j < nodeCount; j++) {
      if (nodes[i]!.distanceTo(nodes[j]!) < 1.65) {
        lineIndices.push(i, j);
      }
    }
  }
  return { positions, colors, pulses, lineIndices, nodeCount };
}

export function SingularityShell({
  entryRef,
  warpOutRef,
}: {
  entryRef: EntryRef;
  warpOutRef: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uWarp: { value: 0 },
        },
        vertexShader: singularityVertex,
        fragmentShader: singularityFragment,
      }),
    [],
  );

  useFrame((state) => {
    const intensity = easeOutCubic(entryRef.current.cosmos) + warpOutRef.current * 0.45;
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uIntensity!.value = intensity;
    mat.uniforms.uWarp!.value = warpOutRef.current;
    if (ref.current) {
      ref.current.visible = intensity > 0.04;
      ref.current.rotation.y = state.clock.elapsedTime * 0.18;
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.25) * 0.06;
      ref.current.scale.setScalar(0.85 + intensity * 0.35);
    }
  });

  return (
    <mesh ref={ref} visible={false}>
      <icosahedronGeometry args={[0.72, 4]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export function DnaHelix({ entryRef }: { entryRef: EntryRef }) {
  const ref = useRef<THREE.Points>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const data = useMemo(() => buildDnaHelix(2, isMobile ? 80 : 140), [isMobile]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
        vertexShader: dnaVertex,
        fragmentShader: dnaFragment,
      }),
    [],
  );

  useFrame((state) => {
    const alpha = clamp01(Math.sin(entryRef.current.progress * Math.PI) * 0.95) * (1 - entryRef.current.cosmos * 0.35);
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uAlpha!.value = alpha;
    if (ref.current) {
      ref.current.visible = alpha > 0.04;
      ref.current.rotation.y = state.clock.elapsedTime * 0.22;
    }
  });

  return (
    <points ref={ref} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
      </bufferGeometry>
      <primitive object={mat} attach="material" />
    </points>
  );
}

export function NeuralCortex({ entryRef }: { entryRef: EntryRef }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const graph = useMemo(() => buildCortexGraph(isMobile ? 22 : 38), [isMobile]);
  const pointMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
        vertexShader: cortexPulseVertex,
        fragmentShader: cortexPulseFragment,
      }),
    [],
  );
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const lp = new Float32Array(graph.lineIndices.length * 3);
    graph.lineIndices.forEach((nodeIdx, i) => {
      lp[i * 3] = graph.positions[nodeIdx * 3]!;
      lp[i * 3 + 1] = graph.positions[nodeIdx * 3 + 1]!;
      lp[i * 3 + 2] = graph.positions[nodeIdx * 3 + 2]!;
    });
    g.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    return g;
  }, [graph]);

  useFrame((state) => {
    const alpha = easeOutCubic(clamp01((entryRef.current.cosmos - 0.2) / 0.8));
    pointMat.uniforms.uTime!.value = state.clock.elapsedTime;
    pointMat.uniforms.uAlpha!.value = alpha;
    if (pointsRef.current) pointsRef.current.visible = alpha > 0.05;
    if (linesRef.current) {
      linesRef.current.visible = alpha > 0.05;
      const lm = linesRef.current.material as THREE.LineBasicMaterial;
      lm.opacity = alpha * 0.22;
    }
  });

  return (
    <group visible={false}>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graph.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[graph.colors, 3]} />
          <bufferAttribute attach="attributes-aPulse" args={[graph.pulses, 1]} />
        </bufferGeometry>
        <primitive object={pointMat} attach="material" />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial color={TEAL} transparent opacity={0} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

export function DataCascade({ entryRef }: { entryRef: EntryRef }) {
  const ref = useRef<THREE.Points>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isMobile ? 400 : 900;
  const data = useMemo(() => buildDataStreams(count), [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
        vertexShader: dataStreamVertex,
        fragmentShader: dataStreamFragment,
      }),
    [],
  );

  useFrame((state) => {
    const alpha = 0.15 + entryRef.current.cosmos * 0.35 + entryRef.current.warpIn * 0.2;
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uAlpha!.value = alpha;
    if (ref.current) ref.current.visible = alpha > 0.08;
  });

  return (
    <points ref={ref} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aSpeed" args={[data.speeds, 1]} />
        <bufferAttribute attach="attributes-aOffset" args={[data.offsets, 1]} />
        <bufferAttribute attach="attributes-aLane" args={[data.lanes, 1]} />
      </bufferGeometry>
      <primitive object={mat} attach="material" />
    </points>
  );
}

export function IgnitionShockwaves({
  entryRef,
  warpOutRef,
}: {
  entryRef: EntryRef;
  warpOutRef: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const mats = useMemo(
    () =>
      [TEAL, GOLD, COGNITIVE].map(
        (color) =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            uniforms: {
              uProgress: { value: 0 },
              uAlpha: { value: 0 },
              uColor: { value: new THREE.Color(color) },
            },
            vertexShader: shockwaveVertex,
            fragmentShader: shockwaveFragment,
          }),
      ),
    [],
  );
  const birthRef = useRef<number | null>(null);

  useFrame((state) => {
    if (!group.current) return;
    const cosmos = entryRef.current.cosmos;
    if (cosmos > 0.42 && birthRef.current === null) birthRef.current = state.clock.elapsedTime;
    const elapsed = birthRef.current !== null ? state.clock.elapsedTime - birthRef.current : 0;
    const active = elapsed > 0 && elapsed < 2.8;
    group.current.visible = active || warpOutRef.current > 0.05;
    group.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mats[i]!;
      const delay = i * 0.22;
      const progress = warpOutRef.current > 0.05
        ? warpOutRef.current * 0.85
        : clamp01((elapsed - delay) / 1.6);
      mat.uniforms.uProgress!.value = progress;
      mat.uniforms.uAlpha!.value = warpOutRef.current > 0.05
        ? warpOutRef.current
        : clamp01(cosmos) * (1 - progress * 0.65);
      mesh.rotation.x = Math.PI / 2.3;
      mesh.scale.setScalar(0.5 + progress * 4.5);
    });
  });

  return (
    <group ref={group} visible={false}>
      {mats.map((mat, i) => (
        <mesh key={i}>
          <ringGeometry args={[0.35, 1.2, 64]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

export function HolographicNux({
  entryRef,
  warpOutRef,
}: {
  entryRef: EntryRef;
  warpOutRef: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame((state) => {
    if (!group.current) return;
    const alpha = easeOutCubic(clamp01((entryRef.current.cosmos - 0.55) / 0.45));
    group.current.visible = alpha > 0.06;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
    group.current.scale.setScalar(0.35 + alpha * 0.12 + warpOutRef.current * 0.08);

    const mat = matRef.current;
    if (mat) {
      mat.emissiveIntensity = alpha * 2.2 + warpOutRef.current;
      mat.opacity = alpha * 0.95;
    }
  });

  return (
    <group ref={group} visible={false}>
      <Center>
        <Text3D
          font={FONT_URL}
          size={0.42}
          height={0.1}
          bevelEnabled
          bevelThickness={0.012}
          bevelSize={0.008}
          bevelSegments={3}
          curveSegments={12}
        >
          NUX
          <meshStandardMaterial
            ref={matRef}
            color={GOLD}
            emissive={TEAL}
            emissiveIntensity={0}
            metalness={0.85}
            roughness={0.18}
            transparent
            opacity={0}
          />
        </Text3D>
      </Center>
    </group>
  );
}

export function buildCameraPath() {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 5.5, 18),
      new THREE.Vector3(1.2, 2.8, 11),
      new THREE.Vector3(-1.8, 1.2, 7),
      new THREE.Vector3(0.6, 0.6, 5.2),
      new THREE.Vector3(0, 0.45, 4.35),
    ],
    false,
    "catmullrom",
    0.42,
  );
}
