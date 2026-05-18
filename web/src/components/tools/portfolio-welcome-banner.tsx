"use client";

import { Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function PortfolioWelcomeBanner({ initialOpen = true }: { initialOpen?: boolean }) {
  const t = useTranslations("Portfolio");
  const [visible, setVisible] = useState(initialOpen);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/10 px-4 py-4"
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
          <Sparkles className="size-4 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{t("welcomeTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("welcomeLead")}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label={t("welcomeDismiss")}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
