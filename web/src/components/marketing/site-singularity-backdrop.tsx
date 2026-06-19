"use client";

import { useEffect, useRef, useState } from "react";
import { useSingularityViewportSignature } from "@/components/marketing/intro-mobile";
import { mountSingularityScene } from "@/components/marketing/singularity-scene";

function isIntroActive() {
  const root = document.documentElement;
  return (
    root.hasAttribute("data-pronux-intro") || root.hasAttribute("data-pronux-intro-pending")
  );
}

export function SiteSingularityBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const viewportSignature = useSingularityViewportSignature();

  useEffect(() => {
    if (!isIntroActive()) {
      setReady(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (!isIntroActive()) setReady(true);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-pronux-intro", "data-pronux-intro-pending"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = rootRef.current;
    if (!root) return;

    return mountSingularityScene({
      root,
      mode: "ambient",
      offerings: [],
      pointerInteractive: true,
    });
  }, [ready, viewportSignature]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      data-singularity-backdrop
      aria-hidden
    />
  );
}
