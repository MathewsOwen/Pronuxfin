"use client";

import { useTranslations } from "next-intl";
import { MAIN_CONTENT_ID } from "@/lib/content-anchor";

export function SkipLink() {
  const t = useTranslations("SkipLink");

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only transition-[transform,opacity] duration-200 focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:block focus:h-auto focus:w-auto focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background motion-safe:focus:translate-y-0.5"
    >
      {t("label")}
    </a>
  );
}
