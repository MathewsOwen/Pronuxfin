"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PortfolioClearAllButton({ positionCount }: { positionCount: number }) {
  const t = useTranslations("Portfolio");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (positionCount < 1) return null;

  async function clearAll() {
    if (!window.confirm(t("clearAllConfirm", { count: positionCount }))) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/user/portfolio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    setPending(false);
    if (!res.ok) {
      setError(t("clearAllError"));
      return;
    }
    router.push("/carteira");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => void clearAll()}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-muted-foreground hover:text-rose-400",
          pending && "opacity-60",
        )}
      >
        {pending ? t("clearingAll") : t("clearAllCta")}
      </button>
      {error ? (
        <p className="text-xs text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
