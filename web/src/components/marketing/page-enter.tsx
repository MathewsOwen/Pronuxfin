"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type PageEnterProps = {
  children: React.ReactNode;
  id?: string;
  tabIndex?: number;
  className?: string;
};

/** Subtle content entrance on navigation; skips motion when reduced-motion is requested. */
export function PageEnter({ children, id, tabIndex = -1, className }: PageEnterProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <main key={pathname} id={id} tabIndex={tabIndex} className={cn(className)}>
        {children}
      </main>
    );
  }

  return (
    <motion.main
      key={pathname}
      id={id}
      tabIndex={tabIndex}
      className={cn(className)}
      initial={{ opacity: 0.88, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}
