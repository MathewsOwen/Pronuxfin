"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export function SystemDegradationBanner({
  reason,
}: {
  reason?: string;
}) {
  const t = useTranslations("PlatformDegradation");

  return (
    <div className="border-b border-amber-300/25 bg-amber-400/10 px-4 py-2.5 text-amber-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-2 text-xs sm:text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <p className="leading-relaxed">
          {t("bannerLead")}
          {reason ? <> {t("detail", { reason })}</> : null}
        </p>
      </div>
    </div>
  );
}
