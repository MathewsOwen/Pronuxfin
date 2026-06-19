import { describe, expect, it } from "vitest";
import { getSingularityViewportProfile } from "@/components/marketing/intro-mobile";
import {
  DISK_R_MIN,
  estimateDiskCapacity,
  resolveDiskLayout,
} from "@/components/marketing/singularity-scene";

const MIN_SEP = 2.35;

function sampleMinPairDistance(
  positions: { x: number; y: number; z: number; scale: number }[],
  samples = 240,
) {
  const visible = positions.filter((p) => p.scale > 0);
  if (visible.length < 2) return Number.POSITIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  for (let n = 0; n < samples; n++) {
    const i = n % visible.length;
    const j = (n * 17 + 11) % visible.length;
    if (i === j) continue;
    const a = visible[i]!;
    const b = visible[j]!;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    min = Math.min(min, Math.sqrt(dx * dx + dy * dy + dz * dz));
  }
  return min;
}

function effectiveSeparation(minSep: number, scale: number) {
  const streakSpan = 2.2 * scale;
  return Math.max(minSep, streakSpan * 1.04);
}

describe("placeDiskInstances", () => {
  const viewports = [
    { label: "desktop intro", width: 1440, height: 900, mode: "intro" as const },
    { label: "desktop ambient", width: 1440, height: 900, mode: "ambient" as const },
    { label: "mobile intro portrait", width: 390, height: 844, mode: "intro" as const },
    { label: "mobile ambient landscape", width: 844, height: 390, mode: "ambient" as const },
  ];

  it.each(viewports)(
    "keeps spacing for $label",
    ({ width, height, mode }) => {
      const profile = getSingularityViewportProfile(width, height, mode);
      const scale = profile.isMobile ? 0.56 : 0.68;
      const { count: target, positions } = resolveDiskLayout(
        profile.instanceCount,
        MIN_SEP,
        scale,
        profile.diskRMax,
      );

      expect(positions).toHaveLength(target);
      const sep = effectiveSeparation(MIN_SEP, scale);
      const visible = positions.filter((p) => p.scale > 0);
      expect(visible.length).toBeGreaterThanOrEqual(target * 0.99);
      expect(sampleMinPairDistance(positions)).toBeGreaterThanOrEqual(sep * 0.95);

      for (const pos of visible) {
        const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        expect(r).toBeGreaterThanOrEqual(DISK_R_MIN - 0.01);
        expect(r).toBeLessThanOrEqual(profile.diskRMax + 10.5);
      }
    },
    30_000,
  );
});

describe("getSingularityViewportProfile", () => {
  it("uses larger disk radius on desktop than mobile intro", () => {
    const desktop = getSingularityViewportProfile(1440, 900, "intro");
    const mobile = getSingularityViewportProfile(390, 844, "intro");
    expect(desktop.diskRMax).toBeGreaterThan(mobile.diskRMax);
    expect(desktop.instanceCount).toBeGreaterThan(mobile.instanceCount);
  });

  it("fits requested counts inside disk capacity", () => {
    const profiles = [
      getSingularityViewportProfile(1440, 900, "intro"),
      getSingularityViewportProfile(1440, 900, "ambient"),
      getSingularityViewportProfile(390, 844, "intro"),
      getSingularityViewportProfile(844, 390, "ambient"),
    ];
    for (const profile of profiles) {
      const scale = profile.isMobile ? 0.56 : 0.68;
      const fit = Math.floor(
        estimateDiskCapacity(DISK_R_MIN, profile.diskRMax, MIN_SEP, scale) * 0.8,
      );
      expect(fit).toBeGreaterThanOrEqual(profile.instanceCount * 0.75);
    }
  });

  it("tilts the disk on mobile intro only", () => {
    const mobileIntro = getSingularityViewportProfile(390, 844, "intro");
    const mobileAmbient = getSingularityViewportProfile(390, 844, "ambient");
    const desktopIntro = getSingularityViewportProfile(1440, 900, "intro");
    expect(mobileIntro.diskTiltX).toBeGreaterThan(0);
    expect(mobileIntro.fixedCamera).toBe(true);
    expect(mobileAmbient.diskTiltX).toBe(0);
    expect(desktopIntro.diskTiltX).toBe(0);
  });
});
