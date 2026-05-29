import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import {
  computeBudgetedDpr,
  getSingularityViewportProfile,
  type SingularitySceneMode,
} from "@/components/marketing/intro-mobile";
import {
  AURA_FRAGMENT,
  AURA_VERTEX,
  DISK_FRAGMENT,
  DISK_VERTEX,
  NOISE_CHUNK,
} from "@/components/marketing/pronux-intro-singularity-shaders";

const BH_RADIUS = 4;

const OFFERING_COLORS = [
  "#2dd4bf",
  "#ede4d4",
  "#a78bfa",
  "#38bdf8",
  "#fbbf60",
  "#6ee7b7",
  "#d9778e",
  "#818cf8",
  "#34d399",
  "#c4b5fd",
] as const;

export type SingularityOffering = {
  label: string;
  colorIndex?: number;
};

type OrbitSlot = {
  initialAngle: number;
  yOffset: number;
  crystal: THREE.Mesh;
};

export type MountSingularityOptions = {
  root: HTMLElement;
  mode?: SingularitySceneMode;
  offerings?: SingularityOffering[];
  getWarp?: () => number;
  pointerInteractive?: boolean;
};

function diskOrbitalVelocity(r: number, orbitScale: number) {
  return (1.5 / Math.sqrt(r)) * orbitScale;
}

function createLabelElement(label: string, color: string, compact: boolean) {
  const el = document.createElement("div");
  el.className = compact
    ? "whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[8px] font-medium tracking-wide backdrop-blur-md select-none max-w-[9.5rem] truncate sm:max-w-none sm:truncate-none sm:px-3 sm:py-1 sm:text-[11px]"
    : "whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide backdrop-blur-md sm:px-3 sm:text-[11px] select-none";
  el.textContent = label;
  el.title = label;
  el.style.color = "rgba(255,255,255,0.94)";
  el.style.borderColor = `${color}66`;
  el.style.background = `linear-gradient(135deg, ${color}28, rgba(1,1,3,0.82))`;
  el.style.boxShadow = `0 0 20px ${color}30, 0 4px 24px rgba(0,0,0,0.45)`;
  el.style.pointerEvents = "none";
  return el;
}

export function mountSingularityScene(options: MountSingularityOptions): () => void {
  const { root, mode = "intro", offerings = [], getWarp, pointerInteractive = mode === "ambient" } =
    options;

  const w0 = root.clientWidth || window.innerWidth;
  const h0 = root.clientHeight || window.innerHeight;
  const profile0 = getSingularityViewportProfile(w0, h0, mode);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010103);

  const camera = new THREE.PerspectiveCamera(40, w0 / Math.max(h0, 1), 0.1, 1000);
  camera.position.set(60, 30, 60);

  const renderer = new THREE.WebGLRenderer({
    antialias: profile0.antialias,
    powerPreference: "high-performance",
  });
  // Ambient backdrop is lighter than the intro (no post stack) so it gets a
  // more generous pixel budget, still bounded so 4K/5K screens stay smooth.
  renderer.setPixelRatio(
    computeBudgetedDpr(w0, h0, {
      hardCap: profile0.pixelRatioCap,
      budgetPx: profile0.isMobile ? 3_000_000 : 7_000_000,
    }),
  );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = profile0.toneMappingExposure;
  renderer.domElement.style.display = "block";
  root.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.inset = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  root.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.03;
  controls.autoRotate = true;
  controls.autoRotateSpeed = profile0.autoRotateSpeed;
  controls.enablePan = false;
  controls.minDistance = profile0.isMobile ? 36 : 40;
  controls.maxDistance = profile0.isMobile ? 110 : 120;
  controls.rotateSpeed = profile0.isMobile ? 0.55 : 0.7;
  controls.enabled = mode === "intro";

  const seg = profile0.sphereSegments;
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  coreGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(BH_RADIUS, seg, seg),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    ),
  );

  const auraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1.0 } },
    vertexShader: AURA_VERTEX,
    fragmentShader: AURA_FRAGMENT,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(BH_RADIUS * 1.06, seg, seg), auraMat));

  const streakGeo = new THREE.CylinderGeometry(0.01, 0.12, 2.2, 3);
  streakGeo.rotateX(Math.PI / 2);

  const diskMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: mode === "ambient" ? 0.08 : 0.1 },
      uCompression: { value: 1.0 },
      uIntensity: { value: mode === "ambient" ? 0.88 : 1.0 },
      uOrbitScale: { value: 0.55 },
    },
    vertexShader: DISK_VERTEX(NOISE_CHUNK),
    fragmentShader: DISK_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const instanceCount = profile0.instanceCount;
  const instancedDisk = new THREE.InstancedMesh(streakGeo, diskMaterial, instanceCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < instanceCount; i++) {
    const r = 5 + Math.pow(Math.random(), 1.3) * 40;
    const angle = Math.random() * Math.PI * 2;
    dummy.position.set(
      Math.cos(angle) * r,
      (Math.random() - 0.5) * (8 / r),
      Math.sin(angle) * r,
    );
    dummy.lookAt(
      dummy.position.x + Math.sin(angle),
      dummy.position.y,
      dummy.position.z - Math.cos(angle),
    );
    dummy.updateMatrix();
    instancedDisk.setMatrixAt(i, dummy.matrix);
  }
  instancedDisk.instanceMatrix.needsUpdate = true;
  scene.add(instancedDisk);

  const orbitGroup = new THREE.Group();
  instancedDisk.add(orbitGroup);

  const slots: OrbitSlot[] = [];
  const count = offerings.length;
  let crystalGeo: THREE.DodecahedronGeometry | null = null;

  if (count > 0) {
    crystalGeo = new THREE.DodecahedronGeometry(profile0.crystalRadius, 0);
    const sharedOrbitR = profile0.orbitRadius;
    for (let i = 0; i < count; i++) {
      const item = offerings[i]!;
      const color = OFFERING_COLORS[item.colorIndex ?? i % OFFERING_COLORS.length]!;
      const initialAngle = (i / count) * Math.PI * 2;
      const yOffset = ((i % 2 === 0 ? 1 : -1) * 0.18) / sharedOrbitR;

      const crystal = new THREE.Mesh(
        crystalGeo,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
        }),
      );
      orbitGroup.add(crystal);

      const label = new CSS2DObject(createLabelElement(item.label, color, profile0.labelCompact));
      label.position.set(0, profile0.labelCompact ? 0.65 : 0.9, 0);
      crystal.add(label);

      slots.push({ initialAngle, yOffset, crystal });
    }
  }

  const sharedOrbitR = profile0.orbitRadius;
  const sharedAngularVelocity = diskOrbitalVelocity(sharedOrbitR, 0.55);
  const camControl = { distance: profile0.camDistance };
  const tilt = { targetX: 0, targetY: 0, x: 0, y: 0 };
  let paused = false;
  let raf = 0;
  const clock = new THREE.Clock();

  const onVisibility = () => {
    paused = document.hidden;
    if (!paused) clock.getDelta();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointerInteractive || !profile0.interactiveTilt) return;
    const rect = root.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(rect.width, 1);
    const ny = (e.clientY - rect.top) / Math.max(rect.height, 1);
    tilt.targetX = (nx - 0.5) * 2;
    tilt.targetY = (ny - 0.5) * 2;
  };

  const resize = () => {
    const w = root.clientWidth;
    const h = root.clientHeight;
    const profile = getSingularityViewportProfile(w, h, mode);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(
      computeBudgetedDpr(w, h, {
        hardCap: profile.pixelRatioCap,
        budgetPx: profile.isMobile ? 3_000_000 : 7_000_000,
      }),
    );
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camControl.distance = profile.camDistance;
  };

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  if (pointerInteractive) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  }

  const animate = () => {
    raf = requestAnimationFrame(animate);
    if (paused) return;

    const time = clock.getElapsedTime();
    const warp = getWarp?.() ?? 0;

    diskMaterial.uniforms.uTime!.value = time;
    auraMat.uniforms.uTime!.value = time;
    auraMat.uniforms.uIntensity!.value = (mode === "ambient" ? 0.92 : 1) + warp * 1.4;
    diskMaterial.uniforms.uIntensity!.value =
      (mode === "ambient" ? 0.82 : 1) + warp * 0.8;
    instancedDisk.rotation.y += 0.00012;

    tilt.x += (tilt.targetX - tilt.x) * 0.04;
    tilt.y += (tilt.targetY - tilt.y) * 0.04;
    instancedDisk.rotation.x = tilt.y * 0.07;
    instancedDisk.rotation.z = tilt.x * 0.05;

    for (const slot of slots) {
      const angle = slot.initialAngle + time * sharedAngularVelocity;
      slot.crystal.position.set(
        Math.cos(angle) * sharedOrbitR,
        slot.yOffset,
        Math.sin(angle) * sharedOrbitR,
      );
      slot.crystal.rotation.set(time * 0.35 + slot.initialAngle, time * 0.5, time * 0.2);
    }

    const currentDir = new THREE.Vector3()
      .subVectors(camera.position, controls.target)
      .normalize();
    camera.position.x = controls.target.x + currentDir.x * camControl.distance;
    camera.position.z = controls.target.z + currentDir.z * camControl.distance;

    controls.update();
    renderer.render(scene, camera);
    if (count > 0) labelRenderer.render(scene, camera);
  };

  animate();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    if (pointerInteractive) window.removeEventListener("pointermove", onPointerMove);
    controls.dispose();
    streakGeo.dispose();
    crystalGeo?.dispose();
    diskMaterial.dispose();
    auraMat.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === root) root.removeChild(renderer.domElement);
    if (labelRenderer.domElement.parentElement === root) root.removeChild(labelRenderer.domElement);
  };
}
