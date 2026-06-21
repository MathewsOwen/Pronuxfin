"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const landingEase = [0.22, 1, 0.36, 1] as const;

export const viewportStandard = {
  once: true,
  amount: 0.14,
  margin: "0px 0px -12% 0px",
} as const;

/** Parent: orchestrates staggered appearance of descendants using `landingItem` variants. */
export const landingListContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

export const landingItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: landingEase },
  },
};

export const landingItemTight: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: landingEase },
  },
};

type RevealSectionProps = {
  children: ReactNode;
  className?: string;
};

/** Outer section choreography: headings + grids reveal in sequence when scrolling. */
export function RevealSection({ children, className }: RevealSectionProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewportStandard}
      variants={landingListContainer}
    >
      {children}
    </motion.div>
  );
}

type RevealBlockProps = {
  children: ReactNode;
  className?: string;
  /** Softer vertical travel for dense rows (bullet lines, chips). */
  tight?: boolean;
};

export function RevealBlock({ children, className, tight }: RevealBlockProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={tight ? landingItemTight : landingItem}>
      {children}
    </motion.div>
  );
}

type RevealListProps = {
  children: ReactNode;
  className?: string;
  as?: "ul" | "ol" | "div";
};

/** Stagger list with own `whileInView` (headings standalone below a section heading, etc.). */
export function RevealStaggerList({ children, className, as = "div" }: RevealListProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Cmp = as;
    return <Cmp className={className}>{children}</Cmp>;
  }
  if (as === "ul") {
    return (
      <motion.ul
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={viewportStandard}
        variants={landingListContainer}
      >
        {children}
      </motion.ul>
    );
  }
  if (as === "ol") {
    return (
      <motion.ol
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={viewportStandard}
        variants={landingListContainer}
      >
        {children}
      </motion.ol>
    );
  }
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewportStandard}
      variants={landingListContainer}
    >
      {children}
    </motion.div>
  );
}

/** Stagger orchestrator nested under `RevealSection` (inherits show/hidden; no duplicate viewport). */
export function NestStaggerRoot({ children, className, as = "div" }: RevealListProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Cmp = as;
    return <Cmp className={className}>{children}</Cmp>;
  }
  const shared = {
    className,
    variants: landingListContainer,
  };
  if (as === "ul") return <motion.ul {...shared}>{children}</motion.ul>;
  if (as === "ol") return <motion.ol {...shared}>{children}</motion.ol>;
  return <motion.div {...shared}>{children}</motion.div>;
}

export function NestStaggerLi({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <li className={className}>{children}</li>;
  return (
    <motion.li className={className} variants={landingItemTight}>
      {children}
    </motion.li>
  );
}

export function RevealListRow({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={landingItemTight} className={className}>
      {children}
    </motion.div>
  );
}

type RevealCardProps = {
  children: ReactNode;
  className?: string;
};

/** Hover lift + spring snap (still respects MotionConfig reducedMotion). */
export function RevealCard({ children, className }: RevealCardProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={cn("rounded-2xl border border-transparent", className)}>{children}</div>;
  }
  return (
    <motion.div
      variants={landingItem}
      className={cn("rounded-2xl border border-transparent surface-rise", className)}
      whileTap={{ scale: 0.997 }}
    >
      {children}
    </motion.div>
  );
}

/** Single-panel entrance (glass cards, CTAs). */
export function RevealOnce({
  children,
  className,
  y = 22,
  instant,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  /** Sem esperar scroll — ideal para mesas ao vivo (Bolsa). */
  instant?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce || instant) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportStandard}
      transition={{ duration: 0.52, ease: landingEase }}
    >
      {children}
    </motion.div>
  );
}
