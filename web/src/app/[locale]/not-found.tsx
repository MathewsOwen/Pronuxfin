import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AmbientBackdrop } from "@/components/marketing/ambient-backdrop";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");
  return {
    title: t("title"),
    robots: { index: false, follow: true },
  };
}

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <>
      <AmbientBackdrop />
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] terminal-grid-bg" />
        <div className="glass-panel glow-ring relative max-w-lg rounded-3xl border-white/12 px-8 py-12 text-center ring-1 ring-white/[0.04] sm:px-12">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-400/95">
            {t("errorCode")}
          </p>
          <h1 className="font-heading mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("headline")}
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground leading-relaxed">{t("body")}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "min-w-[11rem] glow-ring")}>
              {t("home")}
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-w-[11rem] border-white/15 bg-white/[0.03] backdrop-blur-sm",
              )}
            >
              {t("dashboard")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
