"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AuthFormStage({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className="w-full max-w-md">{children}</div>;
  }

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
