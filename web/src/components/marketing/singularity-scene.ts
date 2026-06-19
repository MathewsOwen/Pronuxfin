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
  orbitR: number;
  crystal: THREE.Mesh;
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const DISK_R_MIN = 8;

function fillSceneSurface(el: HTMLElement) {
  el.style.position = "absolute";
  el.style.inset = "0";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.display = "block";
}

export function estimateDiskCapacity(
  diskRMin: number,
  diskRMax: number,
  minSeparation: number,
  instanceScale: number,
) {
  const streakSpan = 2.2 * instanceScale;
  const effectiveSep = Math.max(minSeparation, streakSpan * 1.04);
  const area = Math.PI * (diskRMax * diskRMax - diskRMin * diskRMin);
  return Math.max(0, Math.floor(area / (effectiveSep * effectiveSep * 0.84)));
}

export function placeDiskInstances(
  count: number,
  minSeparation: number,
  instanceScale: number,
  diskRMax: number,
) {
  const positions: { x: number; y: number; z: number; angle: number; scale: number }[] =
    [];
  const streakSpan = 2.2 * instanceScale;
  const effectiveSep = Math.max(minSeparation, streakSpan * 1.04);
  const effectiveSepSq = effectiveSep * effectiveSep;
  const cellSize = effectiveSep;
  const grid = new Map<string, { x: number; y: number; z: number }[]>();

  const cellKey = (x: number, y: number, z: number) => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const cz = Math.floor(z / cellSize);
    return `${cx}|${cy}|${cz}`;
  };

  const isCrowded = (x: number, y: number, z: number) => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const cz = Math.floor(z / cellSize);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(`${cx + dx}|${cy + dy}|${cz + dz}`);
          if (!bucket) continue;
          for (const p of bucket) {
            const ddx = p.x - x;
            const ddy = p.y - y;
            const ddz = p.z - z;
            if (ddx * ddx + ddy * ddy + ddz * ddz < effectiveSepSq) return true;
          }
        }
      }
    }
    return false;
  };

  const commit = (
    x: number,
    y: number,
    z: number,
    angle: number,
    scale: number,
  ) => {
    const pos = { x, y, z, angle, scale };
    positions.push(pos);
    const key = cellKey(x, y, z);
    const bucket = grid.get(key);
    if (bucket) bucket.push(pos);
    else grid.set(key, [pos]);
  };

  const tryPlace = (x: number, y: number, z: number, angle: number) => {
    if (!isCrowded(x, y, z)) {
      commit(x, y, z, angle, instanceScale);
      return true;
    }
    return false;
  };

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const r = DISK_R_MIN + Math.sqrt(t) * (diskRMax - DISK_R_MIN);
    const angle = i * GOLDEN_ANGLE;
    const lane = i % 5;
    const y =
      ((lane / 5 - 0.5) * 2 + Math.sin(angle * 2.1) * 0.15) * (5.5 / r);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    if (tryPlace(x, y, z, angle)) continue;

    let placed = false;
    for (let k = 1; k <= 14 && !placed; k++) {
      const a2 = angle + k * 0.38;
      const r2 = r + k * 0.4;
      placed = tryPlace(Math.cos(a2) * r2, y, Math.sin(a2) * r2, a2);
    }

    if (placed) continue;

    for (let dr = 0.45; dr <= 10 && !placed; dr += 0.45) {
      for (let k = 0; k < 20 && !placed; k++) {
        const a3 = angle + k * 0.33;
        const r3 = r + dr;
        placed = tryPlace(Math.cos(a3) * r3, y, Math.sin(a3) * r3, a3);
      }
    }

    if (!placed) {
      commit(0, -9999, 0, angle, 0);
    }
  }

  return positions;
}

export function resolveDiskLayout(
  requested: number,
  minSep: number,
  instanceScale: number,
  diskRMax: number,
) {
  const cap = estimateDiskCapacity(DISK_R_MIN, diskRMax, minSep, instanceScale);
  let count = Math.min(requested, Math.max(Math.floor(cap * 0.8), 1));
  let positions = placeDiskInstances(count, minSep, instanceScale, diskRMax);
  let visible = positions.reduce((n, p) => n + (p.scale > 0 ? 1 : 0), 0);

  if (visible < count * 0.99 && count > 64) {
    count = Math.floor(count * 0.9);
    positions = placeDiskInstances(count, minSep, instanceScale, diskRMax);
    visible = positions.reduce((n, p) => n + (p.scale > 0 ? 1 : 0), 0);
  }

  if (visible < count * 0.99 && count > 64) {
    count = Math.floor(count * 0.9);
    positions = placeDiskInstances(count, minSep, instanceScale, diskRMax);
  }

  return { count, positions };
}

function buildCrystalSlots(
  offerings: SingularityOffering[],
  profile: ReturnType<typeof getSingularityViewportProfile>,
  orbitGroup: THREE.Group,
  crystalGeo: THREE.DodecahedronGeometry,
): OrbitSlot[] {
  const count = offerings.length;
  if (count === 0) return [];

  const orbitR = profile.orbitRadius;
  const slots: OrbitSlot[] = [];

  for (let i = 0; i < count; i++) {
    const item = offerings[i]!;
    const color = OFFERING_COLORS[item.colorIndex ?? i % OFFERING_COLORS.length]!;
    const initialAngle = (i / count) * Math.PI * 2 - Math.PI / 2;

    const crystal = new THREE.Mesh(
      crystalGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
      }),
    );
    orbitGroup.add(crystal);

    if (profile.showCrystalLabels) {
      const label = new CSS2DObject(
        createLabelElement(item.label, color, profile.labelCompact),
      );
      label.position.set(0, profile.labelCompact ? 0.55 : 1.05, 0);
      crystal.add(label);
    }

    slots.push({
      initialAngle,
      yOffset: 0,
      orbitR,
      crystal,
    });
  }

  return slots;
}

export type MountSingularityOptions = {
  root: HTMLElement;
  mode?: SingularitySceneMode;
  offerings?: SingularityOffering[];
  getWarp?: () => number;
  pointerInteractive?: boolean;
};

function syncCameraToProfile(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  profile: ReturnType<typeof getSingularityViewportProfile>,
  distance: number,
) {
  const d = distance;
  const pitch = profile.cameraPitch;
  const targetY = profile.targetYOffset ?? 0;

  if (profile.frontView) {
    camera.position.set(0, d * pitch + profile.cameraYOffset, d);
  } else {
    const azimuth = Math.PI / 4;
    const horizontal = Math.cos(azimuth) * d * 0.88;
    camera.position.set(
      horizontal,
      d * pitch + profile.cameraYOffset,
      horizontal,
    );
  }

  controls.target.set(0, targetY, 0);
  camera.lookAt(0, targetY, 0);
  controls.update();
}

function diskOrbitalVelocity(r: number, orbitScale: number) {
  return (1.5 / Math.sqrt(r)) * orbitScale;
}

function createLabelElement(label: string, color: string, compact: boolean) {
  const el = document.createElement("div");
  el.className = compact
    ? "whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[7px] font-medium tracking-wide backdrop-blur-md select-none max-w-[7.25rem] truncate sm:max-w-none sm:truncate-none sm:px-3 sm:py-1 sm:text-[11px]"
    : "whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide backdrop-blur-md sm:px-3 sm:text-[11px] select-none";
  el.textContent = label;
  el.title = label;
  el.style.color = "rgba(255,255,255,0.92)";
  el.style.borderColor = `${color}77`;
  el.style.background = `linear-gradient(135deg, ${color}40, rgba(1,1,3,0.86))`;
  el.style.boxShadow = `0 0 20px ${color}40, 0 4px 18px rgba(0,0,0,0.45)`;
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

  const camera = new THREE.PerspectiveCamera(
    profile0.fov,
    w0 / Math.max(h0, 1),
    0.1,
    1000,
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: profile0.antialias,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    computeBudgetedDpr(w0, h0, {
      hardCap: profile0.pixelRatioCap,
      budgetPx: profile0.isMobile ? 3_000_000 : 7_000_000,
    }),
  );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = profile0.toneMappingExposure;
  fillSceneSurface(renderer.domElement);
  root.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  fillSceneSurface(labelRenderer.domElement);
  labelRenderer.domElement.style.pointerEvents = "none";
  root.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  syncCameraToProfile(camera, controls, profile0, profile0.camDistance);
  controls.enableDamping = true;
  controls.dampingFactor = 0.03;
  controls.autoRotate = profile0.autoRotate;
  controls.autoRotateSpeed = profile0.autoRotateSpeed;
  controls.enablePan = false;
  controls.enableRotate =
    mode !== "intro" || (mode === "intro" && !profile0.isMobile);
  controls.enableZoom = false;
  controls.minDistance = profile0.isMobile ? 48 : 40;
  controls.maxDistance = profile0.isMobile ? profile0.camDistance + 24 : 120;
  controls.rotateSpeed = profile0.isMobile ? 0.55 : 0.7;
  const fixedCamera = profile0.fixedCamera && mode === "intro";
  controls.enabled = !fixedCamera;

  const singularityRoot = new THREE.Group();
  scene.add(singularityRoot);

  const seg = profile0.sphereSegments;
  const coreGroup = new THREE.Group();
  singularityRoot.add(coreGroup);

  coreGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(BH_RADIUS, seg, seg),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    ),
  );

  const auraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: profile0.auraIntensity } },
    vertexShader: AURA_VERTEX,
    fragmentShader: AURA_FRAGMENT,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(BH_RADIUS * 1.06, seg, seg), auraMat));

  const streakGeo = new THREE.CylinderGeometry(0.01, 0.12, 2.2, 3);
  streakGeo.rotateX(Math.PI / 2);

  const diskMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: profile0.diskMorph ?? (mode === "ambient" ? 0.08 : 0.12) },
      uCompression: { value: 1.0 },
      uIntensity: { value: profile0.diskIntensity },
      uOrbitScale: { value: profile0.diskOrbitScale },
      uDiskRMax: { value: profile0.diskRMax },
    },
    vertexShader: DISK_VERTEX(NOISE_CHUNK),
    fragmentShader: DISK_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const instanceScale = profile0.isMobile ? 0.56 : 0.68;
  const minSep = 2.35;
  const { count: instanceCount, positions: diskPositions } = resolveDiskLayout(
    profile0.instanceCount,
    minSep,
    instanceScale,
    profile0.diskRMax,
  );
  const instancedDisk = new THREE.InstancedMesh(streakGeo, diskMaterial, instanceCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < instanceCount; i++) {
    const pos = diskPositions[i];
    if (!pos) continue;
    const { x, y, z, angle, scale } = pos;
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(scale);
    dummy.lookAt(
      dummy.position.x + Math.sin(angle),
      dummy.position.y,
      dummy.position.z - Math.cos(angle),
    );
    dummy.updateMatrix();
    instancedDisk.setMatrixAt(i, dummy.matrix);
  }
  instancedDisk.instanceMatrix.needsUpdate = true;
  singularityRoot.add(instancedDisk);

  const orbitGroup = new THREE.Group();
  singularityRoot.add(orbitGroup);

  const slots: OrbitSlot[] = [];
  let crystalGeo: THREE.DodecahedronGeometry | null = null;

  if (offerings.length > 0) {
    crystalGeo = new THREE.DodecahedronGeometry(profile0.crystalRadius, 0);
    slots.push(...buildCrystalSlots(offerings, profile0, orbitGroup, crystalGeo));
  }

  const count = offerings.length;
  const camControl = { distance: profile0.camDistance };
  let profile = profile0;
  let useFixedCamera = fixedCamera;
  const tilt = { targetX: 0, targetY: 0, x: 0, y: 0 };
  let paused = false;
  let raf = 0;
  const clock = new THREE.Clock();
  const worldPos = new THREE.Vector3();

  const applySceneTilt = (p: typeof profile0) => {
    if (useFixedCamera) {
      singularityRoot.rotation.x = p.diskTiltX;
      singularityRoot.rotation.z = 0;
    } else {
      singularityRoot.rotation.x = tilt.y * 0.07;
      singularityRoot.rotation.z = tilt.x * 0.05;
    }
  };

  applySceneTilt(profile0);

  const onVisibility = () => {
    paused = document.hidden;
    if (!paused) clock.getDelta();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointerInteractive || !profile.interactiveTilt) return;
    const rect = root.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(rect.width, 1);
    const ny = (e.clientY - rect.top) / Math.max(rect.height, 1);
    tilt.targetX = (nx - 0.5) * 2;
    tilt.targetY = (ny - 0.5) * 2;
  };

  const resize = () => {
    const w = Math.max(root.clientWidth || window.innerWidth, 1);
    const h = Math.max(root.clientHeight || window.innerHeight, 1);
    profile = getSingularityViewportProfile(w, h, mode);
    camera.fov = profile.fov;
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
    diskMaterial.uniforms.uIntensity!.value = profile.diskIntensity;
    diskMaterial.uniforms.uOrbitScale!.value = profile.diskOrbitScale;
    diskMaterial.uniforms.uDiskRMax!.value = profile.diskRMax;
    diskMaterial.uniforms.uMorph!.value =
      profile.diskMorph ?? (mode === "ambient" ? 0.08 : 0.12);
    auraMat.uniforms.uIntensity!.value = profile.auraIntensity;
    renderer.toneMappingExposure = profile.toneMappingExposure;
    controls.autoRotate = profile.autoRotate;
    controls.autoRotateSpeed = profile.autoRotateSpeed;
    useFixedCamera = profile.fixedCamera && mode === "intro";
    controls.enabled = !useFixedCamera;
    controls.enableRotate =
      mode !== "intro" || (mode === "intro" && !profile.isMobile);
    syncCameraToProfile(camera, controls, profile, camControl.distance);
    applySceneTilt(profile);
  };

  let resizeRaf = 0;
  const scheduleResize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      resize();
    });
  };

  const resizeObserver = new ResizeObserver(() => scheduleResize());
  resizeObserver.observe(root);

  const onVisualViewportChange = () => scheduleResize();

  resize();
  window.addEventListener("resize", scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onVisualViewportChange);
    window.visualViewport.addEventListener("scroll", onVisualViewportChange);
  }
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
    const auraBoost = (mode === "ambient" ? 0.92 : 1) + warp * 1.4;
    auraMat.uniforms.uIntensity!.value = profile.auraIntensity * auraBoost;
    diskMaterial.uniforms.uIntensity!.value =
      profile.diskIntensity * ((mode === "ambient" ? 0.82 : 1) + warp * 0.65);

    tilt.x += (tilt.targetX - tilt.x) * 0.04;
    tilt.y += (tilt.targetY - tilt.y) * 0.04;
    applySceneTilt(profile);

    const activeRingSpeed =
      diskOrbitalVelocity(profile.orbitRadius, profile.diskOrbitScale) *
      (profile.crystalOrbitScale ?? 1);
    const crystalOrbitR = profile.orbitRadius;
    orbitGroup.rotation.y = -time * activeRingSpeed;

    for (const slot of slots) {
      slot.crystal.position.set(
        Math.cos(slot.initialAngle) * crystalOrbitR,
        slot.yOffset,
        Math.sin(slot.initialAngle) * crystalOrbitR,
      );
      slot.crystal.rotation.set(
        time * 0.35 + slot.initialAngle,
        time * 0.5,
        time * 0.2,
      );
      const dist = camera.position.distanceTo(slot.crystal.getWorldPosition(worldPos));
      const scaleRef = crystalOrbitR * 2.1;
      const s = THREE.MathUtils.clamp(dist / scaleRef, 0.88, 1.02);
      slot.crystal.scale.setScalar(s);
    }

    if (!useFixedCamera) {
      const currentDir = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();
      camera.position.x = controls.target.x + currentDir.x * camControl.distance;
      camera.position.y =
        controls.target.y + currentDir.y * camControl.distance;
      camera.position.z = controls.target.z + currentDir.z * camControl.distance;
      controls.update();
    }

    renderer.render(scene, camera);
    if (count > 0) labelRenderer.render(scene, camera);
  };

  animate();

  return () => {
    cancelAnimationFrame(raf);
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeObserver.disconnect();
    window.removeEventListener("resize", scheduleResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", onVisualViewportChange);
      window.visualViewport.removeEventListener("scroll", onVisualViewportChange);
    }
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
