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
    <div className="border-b border-status-warning/25 bg-status-warning/10 px-4 py-2.5 text-status-warning sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-2 text-xs sm:text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-warning" />
        <p className="leading-relaxed">
          {t("bannerLead")}
          {reason ? <> {t("detail", { reason })}</> : null}
        </p>
      </div>
    </div>
  );
}
