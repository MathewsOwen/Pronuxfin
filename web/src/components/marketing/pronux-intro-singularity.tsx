"use client";

import { useEffect, useRef } from "react";
import {
  mountSingularityScene,
  type SingularityOffering,
} from "@/components/marketing/singularity-scene";
import { useIntroMobile } from "@/components/marketing/intro-mobile";
import { cn } from "@/lib/utils";

export function PronuxIntroSingularity({
  className,
  warpOut = 0,
  offerings = [],
}: {
  className?: string;
  warpOut?: number;
  offerings?: SingularityOffering[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef(warpOut);
  const isMobile = useIntroMobile();
  const offeringsKey = offerings.map((o) => o.label).join("\0");

  useEffect(() => {
    warpRef.current = warpOut;
  }, [warpOut]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    return mountSingularityScene({
      root,
      mode: "intro",
      offerings,
      getWarp: () => warpRef.current,
      pointerInteractive: !isMobile,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offeringsKey, isMobile]);

  return (
    <div
      ref={rootRef}
      className={cn("absolute inset-0 touch-none select-none", className)}
      aria-hidden
    />
  );
}

export type { SingularityOffering };
