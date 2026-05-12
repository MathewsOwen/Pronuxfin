"use client";

import { MotionConfig } from "framer-motion";

/** Respects `prefers-reduced-motion` for all Framer Motion descendants. */
export function AppMotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
