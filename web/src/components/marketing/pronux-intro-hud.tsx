"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

export function IntroHudOverlay({ visible }: { visible: boolean }) {
  const t = useTranslations("SiteIntro");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const isPt = locale === "pt-BR";

  if (!visible) return null;

  return (
    <header
      className="pointer-events-none absolute inset-x-0 top-[max(1.25rem,env(safe-area-inset-top))] z-[5] px-5 text-center sm:px-8 md:top-8"
      aria-hidden
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-balance text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl md:text-[1.75rem]">
          {isPt ? t("taglinePt") : t("taglineEn")}
        </p>
        <p className="mx-auto mt-2 max-w-md text-pretty text-xs font-normal text-white/45 sm:text-sm">
          {isPt ? t("taglineSubEn") : t("taglineSubPt")}
        </p>
      </motion.div>
    </header>
  );
}
