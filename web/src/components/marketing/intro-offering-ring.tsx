"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

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

/** Raio do anel — alinhado à borda externa do disco na cena 3D. */
const RING_RADIUS_VMIN = 34;

export function IntroOfferingRing({
  offerings,
  visible,
}: {
  offerings: { label: string; colorIndex?: number }[];
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const count = offerings.length;
  if (!visible || count === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center"
      aria-hidden
    >
      <div
        className={cn(
          "relative size-0",
          !reduceMotion && "animate-[pronux-orbit_300s_linear_infinite]",
        )}
      >
        {offerings.map((item, i) => {
          const angle = (i / count) * 360;
          const color = OFFERING_COLORS[item.colorIndex ?? i % OFFERING_COLORS.length]!;
          return (
            <div
              key={item.label}
              className="absolute left-0 top-0"
              style={{
                transform: `rotate(${angle}deg) translateY(-${RING_RADIUS_VMIN}vmin)`,
              }}
            >
              <div style={{ transform: `rotate(-${angle}deg)` }}>
                <div
                  className={cn(
                    !reduceMotion && "animate-[pronux-orbit-counter_300s_linear_infinite]",
                  )}
                >
                  <span
                    className="block -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide backdrop-blur-md sm:px-3 sm:text-[11px]"
                    style={{
                      color: "rgba(255,255,255,0.94)",
                      borderColor: `${color}66`,
                      background: `linear-gradient(135deg, ${color}28, rgba(1,1,3,0.82))`,
                      boxShadow: `0 0 20px ${color}30, 0 4px 24px rgba(0,0,0,0.45)`,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
