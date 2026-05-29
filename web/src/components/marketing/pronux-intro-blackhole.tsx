"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useReducedMotion } from "framer-motion";
import { BlendFunction } from "postprocessing";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  bhAuraFragment,
  bhAuraVertex,
  bhHorizonFragment,
  bhHorizonVertex,
  bhRingFragment,
  bhRingVertex,
  bhStarFragment,
  bhStarVertex,
  bhStreakFragment,
  bhStreakVertex,
} from "@/components/marketing/pronux-intro-blackhole-shaders";
import { GravitationalLensing } from "@/components/marketing/pronux-intro-lensing-effect";
import {
  warpParticleFragment,
  warpParticleVertex,
} from "@/components/marketing/pronux-intro-webgl-shaders";
import {
  buildCameraPath,
  buildWarpParticles,
  clamp01,
  computeEntry,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  SCENE_PHASES,
  type EntryState,
  type PhaseState,
} from "@/components/marketing/pronux-intro-scene-shared";

import { computeBudgetedDpr } from "@/components/marketing/intro-mobile";
import { cn } from "@/lib/utils";

const BLACK_HOLE_RADIUS = 1.85;
const DISK_INNER = BLACK_HOLE_RADIUS + 0.38;
const DISK_OUTER = 8.2;
const DISK_TILT = Math.PI / 3.1;

const STAR_PALETTE = [
  new THREE.Color(0x8899bb),
  new THREE.Color(0xaabbff),
  new THREE.Color(0xddddff),
  new THREE.Color(0xffeedd),
  new THREE.Color(0xffffff),
  new THREE.Color(0x88ddcc),
  new THREE.Color(0x2dd4bf),
];

function buildStars(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkle = new Float32Array(count);
  const radius = 1600;
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const r = Math.cbrt(Math.random()) * radius + 80;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const col = STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)]!.clone();
    col.multiplyScalar(Math.random() * 0.55 + 0.35);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
    sizes[i] = THREE.MathUtils.randFloat(0.45, 2.2);
    twinkle[i] = Math.random() * Math.PI * 2;
  }
  return { positions, colors, sizes, twinkle };
}

function buildInstancedStreaks(count: number) {
  const dummy = new THREE.Object3D();
  const matrices: THREE.Matrix4[] = [];
  for (let i = 0; i < count; i++) {
    const r = 5 + Math.pow(Math.random(), 1.3) * 40;
    const angle = Math.random() * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * (8 / r), Math.sin(angle) * r);
    dummy.lookAt(dummy.position.x + Math.sin(angle), dummy.position.y, dummy.position.z - Math.cos(angle));
    dummy.updateMatrix();
    matrices.push(dummy.matrix.clone());
  }
  return matrices;
}

function readPhaseUniforms(phaseRef: React.RefObject<PhaseState>) {
  const pr = phaseRef.current;
  const from = SCENE_PHASES[pr.current]!;
  const to = SCENE_PHASES[pr.target]!;
  const b = pr.blend;
  return {
    morph: lerp(from.morph, to.morph, b),
    compress: lerp(from.compress, to.compress, b),
    intensity: lerp(from.intensity, to.intensity, b),
    orbit: lerp(from.orbit, to.orbit, b),
    rotate: lerp(from.rotate, to.rotate, b),
    lensing: lerp(from.lensing, to.lensing, b),
  };
}

function StarField({ count, entryRef }: { count: number; entryRef: React.RefObject<EntryState> }) {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => buildStars(count), [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
        vertexShader: bhStarVertex,
        fragmentShader: bhStarFragment,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state) => {
    const alpha = 0.35 + entryRef.current.cosmos * 0.65;
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.visible = alpha > 0.1;
      ref.current.rotation.y = state.clock.elapsedTime * 0.0025;
      ref.current.rotation.x = state.clock.elapsedTime * 0.0008;
    }
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-twinkle" args={[data.twinkle, 1]} />
      </bufferGeometry>
      <primitive object={mat} attach="material" />
    </points>
  );
}

function WarpTunnel({
  entryRef,
  warpRef,
}: {
  entryRef: React.RefObject<EntryState>;
  warpRef: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Points>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isMobile ? 900 : 2200;
  const data = useMemo(() => buildWarpParticles(count), [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
        vertexShader: warpParticleVertex,
        fragmentShader: warpParticleFragment,
      }),
    [],
  );

  useFrame((state) => {
    const strength = Math.max(entryRef.current.warpIn, warpRef.current * 0.95);
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uStrength!.value = strength;
    if (ref.current) ref.current.visible = strength > 0.02;
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

function BlackHoleCore({
  phaseRef,
  warpRef,
  entryRef,
}: {
  phaseRef: React.RefObject<PhaseState>;
  warpRef: React.RefObject<number>;
  entryRef: React.RefObject<EntryState>;
}) {
  const horizonMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCameraPosition: { value: new THREE.Vector3() },
          uIntensity: { value: 1 },
        },
        vertexShader: bhHorizonVertex,
        fragmentShader: bhHorizonFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    [],
  );
  const auraMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uIntensity: { value: 1 } },
        vertexShader: bhAuraVertex,
        fragmentShader: bhAuraFragment,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const { camera } = useThree();

  useFrame((state) => {
    const u = readPhaseUniforms(phaseRef);
    const warp = warpRef.current;
    const reveal = easeOutCubic(entryRef.current.cosmos);
    const boost = (1 + warp * 1.6) * reveal;
    horizonMat.uniforms.uTime!.value = state.clock.elapsedTime;
    horizonMat.uniforms.uCameraPosition!.value.copy(camera.position);
    horizonMat.uniforms.uIntensity!.value = u.intensity * boost;
    auraMat.uniforms.uIntensity!.value = u.intensity * boost * 0.82;
  });

  return (
    <group>
      <mesh renderOrder={0}>
        <sphereGeometry args={[BLACK_HOLE_RADIUS, 96, 64]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh renderOrder={1}>
        <sphereGeometry args={[BLACK_HOLE_RADIUS * 1.05, 96, 64]} />
        <primitive object={horizonMat} attach="material" />
      </mesh>
      <mesh renderOrder={2}>
        <sphereGeometry args={[BLACK_HOLE_RADIUS * 1.16, 64, 64]} />
        <primitive object={auraMat} attach="material" />
      </mesh>
    </group>
  );
}

function AccretionRing({
  phaseRef,
  warpRef,
  entryRef,
}: {
  phaseRef: React.RefObject<PhaseState>;
  warpRef: React.RefObject<number>;
  entryRef: React.RefObject<EntryState>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 }, uMorph: { value: 0.08 } },
        vertexShader: bhRingVertex,
        fragmentShader: bhRingFragment(DISK_INNER, DISK_OUTER),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state, delta) => {
    const u = readPhaseUniforms(phaseRef);
    const warp = warpRef.current;
    const reveal = easeOutCubic(entryRef.current.cosmos);
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uIntensity!.value = u.intensity * reveal * (1 + warp * 0.55);
    mat.uniforms.uMorph!.value = u.morph;
    if (ref.current) {
      ref.current.visible = reveal > 0.08;
      ref.current.rotation.z += delta * 0.0014 * u.orbit;
    }
  });

  return (
    <mesh ref={ref} rotation={[DISK_TILT, 0, 0]} renderOrder={3} visible={false}>
      <ringGeometry args={[DISK_INNER, DISK_OUTER, 256, 128]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function InstancedStreakDisk({
  count,
  phaseRef,
  warpRef,
  entryRef,
}: {
  count: number;
  phaseRef: React.RefObject<PhaseState>;
  warpRef: React.RefObject<number>;
  entryRef: React.RefObject<EntryState>;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.01, 0.11, 2.1, 3);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const matrices = useMemo(() => buildInstancedStreaks(count), [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0.08 },
          uCompression: { value: 1 },
          uIntensity: { value: 1 },
          uOrbitScale: { value: 1 },
        },
        vertexShader: bhStreakVertex,
        fragmentShader: bhStreakFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    if (!ref.current) return;
    matrices.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame((state) => {
    const u = readPhaseUniforms(phaseRef);
    const warp = warpRef.current;
    const reveal = easeOutCubic(entryRef.current.cosmos);
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    mat.uniforms.uMorph!.value = u.morph;
    mat.uniforms.uCompression!.value = u.compress * (1 - warp * 0.18);
    mat.uniforms.uIntensity!.value = u.intensity * reveal * (1 + warp * 0.85);
    mat.uniforms.uOrbitScale!.value = u.orbit * (1 + warp * 2.2);
    if (ref.current) {
      ref.current.visible = reveal > 0.12;
      ref.current.rotation.y += 0.0001 * (1 + warp * 0.8);
    }
  });

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} renderOrder={4} visible={false} />;
}

function ScenePostFX({
  phaseRef,
  warpRef,
  entryRef,
  bhScreenRef,
}: {
  phaseRef: React.RefObject<PhaseState>;
  warpRef: React.RefObject<number>;
  entryRef: React.RefObject<EntryState>;
  bhScreenRef: React.RefObject<THREE.Vector2>;
}) {
  const [fx, setFx] = useState({
    bloom: 1.2,
    chroma: 0.0006,
    lensX: 0.5,
    lensY: 0.5,
    lensStrength: 0.09,
    aspect: 1,
  });
  const frame = useRef(0);
  const { size } = useThree();

  useFrame(() => {
    frame.current += 1;
    if (frame.current % 3 !== 0) return;
    const u = readPhaseUniforms(phaseRef);
    const warp = warpRef.current;
    const cosmos = entryRef.current.cosmos;
    setFx({
      bloom: 0.72 + cosmos * 0.28 + warp * 0.55 + u.intensity * 0.08,
      chroma: warp * 0.0025 + entryRef.current.warpIn * 0.001 + u.lensing * 0.0005,
      lensX: bhScreenRef.current.x,
      lensY: bhScreenRef.current.y,
      lensStrength: u.lensing + warp * 0.05 + cosmos * 0.025,
      aspect: size.width / Math.max(size.height, 1),
    });
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.18}
        luminanceSmoothing={0.88}
        intensity={fx.bloom}
        mipmapBlur
      />
      <GravitationalLensing
        blackHoleScreenPos={[fx.lensX, fx.lensY]}
        lensingStrength={fx.lensStrength}
        lensingRadius={0.28}
        aspectRatio={fx.aspect}
        chromaticAberration={0.0035}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[fx.chroma, fx.chroma * 0.72]}
        radialModulation
        modulationOffset={0.55}
      />
      <Noise opacity={0.028} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.18} darkness={0.52} />
    </EffectComposer>
  );
}

function SceneContent({
  warpOutRef,
  reduceMotion,
  interactionRef,
}: {
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
  const phaseRef = useRef<PhaseState>({ current: 0, target: 0, blend: 1 });
  const transitionRef = useRef({ active: false, start: 0, duration: 4200 });
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const worldRef = useRef<THREE.Group>(null);
  const bhScreenRef = useRef(new THREE.Vector2(0.5, 0.5));
  const bhWorldPos = useMemo(() => new THREE.Vector3(), []);
  const frameCount = useRef(0);
  const [orbitEnabled, setOrbitEnabled] = useState(false);
  const cameraPath = useMemo(() => buildCameraPath(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();
  const isMobile = size.width < 768;
  const starCount = isMobile ? 10000 : 42000;
  const streakCount = isMobile ? 2000 : 4500;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pronux-blackhole-phase", { detail: { index: 0 } }));
  }, [reduceMotion]);

  useFrame((state, delta) => {
    frameCount.current += 1;
    const elapsed = reduceMotion ? 99999 : performance.now() - startRef.current;
    const entry = computeEntry(elapsed, reduceMotion);
    entryRef.current = entry;

    const tr = transitionRef.current;
    if (tr.active) {
      const t = clamp01((performance.now() - tr.start) / tr.duration);
      phaseRef.current.blend = easeInOutCubic(t);
      if (t >= 1) tr.active = false;
    }

    const inter = interactionRef.current;
    const warp = warpOutRef.current;
    inter.spin += inter.spinVel;
    inter.spinVel *= 0.965 * (1 - warp * 0.08);
    inter.activity *= 0.965;
    inter.tiltX += (inter.targetTiltX - inter.tiltX) * 0.055;
    inter.tiltY += (inter.targetTiltY - inter.tiltY) * 0.055;

    if (worldRef.current) {
      worldRef.current.rotation.x = inter.tiltY * 0.14;
      worldRef.current.rotation.z = inter.tiltX * 0.1;
    }

    const u = readPhaseUniforms(phaseRef);
    const ready = entry.phase === "ready" || entry.raw >= 0.55;
    if (ready && !orbitEnabled) setOrbitEnabled(true);

    if (!ready || reduceMotion) {
      const pathT = easeOutCubic(entry.progress);
      const pathPos = cameraPath.getPointAt(pathT);
      const pathLook = cameraPath.getPointAt(clamp01(pathT + 0.04));
      lookTarget.set(pathLook.x + inter.tiltX * 0.2, pathLook.y + inter.tiltY * 0.15, pathLook.z);
      pathPos.z -= warp * 5;
      pathPos.y += warp * 0.8;
      camera.position.lerp(pathPos, 1 - Math.pow(0.001, delta));
      camera.lookAt(lookTarget);
    } else if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 0.045 + u.rotate * 0.35;
      controlsRef.current.update();
    }

    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      const targetFov = 52 + warp * 18 - entry.warpIn * 10;
      persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, 0.05);
      persp.updateProjectionMatrix();
    }

    bhWorldPos.set(0, 0, 0);
    bhWorldPos.project(camera);
    bhScreenRef.current.set((bhWorldPos.x + 1) / 2, (bhWorldPos.y + 1) / 2);

    if (frameCount.current % 12 === 0) {
      window.dispatchEvent(
        new CustomEvent("pronux-cosmos-entry", {
          detail: { progress: entry.raw, phase: entry.phase, ready: entry.raw >= 0.55 },
        }),
      );
    }
    if (frameCount.current % 18 === 0) {
      window.dispatchEvent(
        new CustomEvent("pronux-cosmos-telemetry", {
          detail: {
            activity: Math.round((inter.activity + entry.cosmos * 0.35 + u.intensity * 0.2) * 100),
            spin: Math.abs(inter.spinVel * 1000).toFixed(1),
            services: 10,
            warp,
            phase: phaseRef.current.target,
          },
        }),
      );
    }
  });

  return (
    <>
      <color attach="background" args={["#010103"]} />
      <fog attach="fog" args={["#020104", 24, 160]} />
      <ambientLight intensity={0.06} />

      <StarField count={starCount} entryRef={entryRef} />
      <WarpTunnel entryRef={entryRef} warpRef={warpOutRef} />

      <group ref={worldRef}>
        <BlackHoleCore phaseRef={phaseRef} warpRef={warpOutRef} entryRef={entryRef} />
        <AccretionRing phaseRef={phaseRef} warpRef={warpOutRef} entryRef={entryRef} />
        <InstancedStreakDisk
          count={streakCount}
          phaseRef={phaseRef}
          warpRef={warpOutRef}
          entryRef={entryRef}
        />
      </group>

      {orbitEnabled && !reduceMotion ? (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.038}
          autoRotate
          autoRotateSpeed={0.05}
          enablePan={false}
          minDistance={6}
          maxDistance={22}
          rotateSpeed={0.32}
        />
      ) : null}

      {!reduceMotion ? (
        <ScenePostFX
          phaseRef={phaseRef}
          warpRef={warpOutRef}
          entryRef={entryRef}
          bhScreenRef={bhScreenRef}
        />
      ) : null}
    </>
  );
}

export type IntroOffering = {
  label: string;
  description?: string;
  colorIndex?: number;
  ring?: number;
  emphasis?: "core" | "inner" | "standard";
  sublabel?: string;
  phase?: number;
};

/** Cena unificada: buraco negro + lensing + entrada cinematográfica + orbitais NUX. */
export function PronuxIntroScene({
  offerings: _offerings,
  className,
  warpOut = 0,
}: {
  offerings: IntroOffering[];
  className?: string;
  warpOut?: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement>(null);
  const warpOutRef = useRef(warpOut);
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

  useEffect(() => {
    warpOutRef.current = warpOut;
  }, [warpOut]);

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

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduceMotion) return;

    const syncPointer = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const s = interactionRef.current;
      s.targetTiltX = (nx - 0.5) * 2;
      s.targetTiltY = (ny - 0.5) * 2;
      s.activity = Math.min(1, s.activity + 0.03);
    };

    const onDown = (e: PointerEvent) => {
      interactionRef.current.dragging = true;
      interactionRef.current.lastX = e.clientX;
      syncPointer(e);
      wrap.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      syncPointer(e);
      const s = interactionRef.current;
      if (s.dragging) {
        const dx = e.clientX - s.lastX;
        const gain = wrap.clientWidth < 768 ? 0.008 : 0.005;
        s.spinVel += dx * gain;
        s.lastX = e.clientX;
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
        camera={{ position: [0, 6.5, 16], fov: 48, near: 0.1, far: 4000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.22,
          stencil: false,
          depth: true,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            warpOutRef={warpOutRef}
            reduceMotion={reduceMotion}
            interactionRef={interactionRef}
          />
        </Suspense>
      </Canvas>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_0%,rgba(1,1,3,0.18)_65%,rgba(0,0,0,0.55)_100%)]"
        aria-hidden
      />
    </div>
  );
}

/** @deprecated Use PronuxIntroScene */
export const PronuxIntroBlackHole = PronuxIntroScene;
