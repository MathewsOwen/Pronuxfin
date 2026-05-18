import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import { privateAppMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Education");
  return privateAppMetadata({
    pathname: "/education",
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
  });
}

export default async function EducationPage() {
  const t = await getTranslations("Education");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-10 text-center md:px-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-950/20">
          <BookOpen className="size-7 text-emerald-300" />
        </div>
        <p className="font-mono mt-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("comingSoonEyebrow")}
        </p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">{t("comingSoonTitle")}</h1>
        <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted-foreground">{t("comingSoonLead")}</p>
        <p className="mx-auto mt-4 max-w-lg text-xs text-muted-foreground">{t("comingSoonDisclaimer")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/ferramentas/juros-compostos" className={buttonVariants({ size: "sm" })}>
            {t("ctaCalculator")}
          </Link>
          <Link href="/rota" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("ctaRoute")}
          </Link>
          <Link href="/noticias" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("ctaNews")}
          </Link>
        </div>
      </div>
    </div>
  );
}
