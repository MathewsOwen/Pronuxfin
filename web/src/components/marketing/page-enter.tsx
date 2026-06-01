"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type PageEnterProps = {
  children: React.ReactNode;
  id?: string;
  tabIndex?: number;
  className?: string;
  /** Oculta o conteúdo principal de leitores quando um diálogo modal está aberto. */
  "aria-hidden"?: boolean;
  inert?: boolean;
};

/** Subtle content entrance on navigation; skips motion when reduced-motion is requested. */
export function PageEnter({
  children,
  id,
  tabIndex = -1,
  className,
  "aria-hidden": ariaHidden,
  inert,
}: PageEnterProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <main
        id={id}
        tabIndex={tabIndex}
        className={cn(className)}
        aria-hidden={ariaHidden}
        {...(inert ? { inert: true } : {})}
      >
        {children}
      </main>
    );
  }

  return (
    <motion.main
      id={id}
      tabIndex={tabIndex}
      className={cn(className)}
      aria-hidden={ariaHidden}
      {...(inert ? { inert: true } : {})}
    >
      <motion.div
        key={pathname}
        initial={{ opacity: 0.94, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.main>
  );
}
