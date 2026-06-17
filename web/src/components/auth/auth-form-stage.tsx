"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AuthFormStage({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className="pointer-events-auto w-full max-w-[440px]">{children}</div>;
  }

  return (
    <motion.div
      className="pointer-events-auto w-full max-w-[440px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
