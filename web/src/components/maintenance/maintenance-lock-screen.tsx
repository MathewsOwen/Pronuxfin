import { AlertTriangle, RefreshCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductionReadiness } from "@/lib/production-readiness";

export async function MaintenanceLockScreen({
  readiness,
}: {
  readiness: ProductionReadiness;
}) {
  const t = await getTranslations("Maintenance");
  const tNav = await getTranslations("NotFound");

  return (
    <main className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-16">
      <div className="glass-panel glow-ring w-full rounded-3xl border-white/12 px-8 py-12 text-center ring-1 ring-white/[0.04] sm:px-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/12 text-amber-300">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="font-heading mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("headline")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("body")}</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-background/40 p-4 text-left">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("checksLabel")}
          </p>
          <ul className="space-y-2 text-sm">
            {readiness.checks.map((check) => (
              <li key={check.key} className="flex items-center justify-between gap-3">
                <span className="truncate text-foreground/90">{check.key}</span>
                <span className={check.ok ? "text-emerald-300" : "text-rose-300"}>
                  {check.ok ? t("checkOk") : check.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "min-w-[10.5rem]")}>
            {tNav("home")}
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-w-[10.5rem] border-white/15 bg-white/[0.03]",
            )}
          >
            <RefreshCcw className="mr-1 size-4" />
            {t("retry")}
          </Link>
        </div>
      </div>
    </main>
  );
}
