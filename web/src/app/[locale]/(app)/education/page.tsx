import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight, Sparkles, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const trails = t.raw("trails") as Array<{
    title: string;
    desc: string;
    level: string;
    progressPct: string;
  }>;
  const progressValues = trails.map((trail) => Number(trail.progressPct) || 0);
  const averageProgress = Math.round(
    progressValues.reduce((sum, value) => sum + value, 0) / Math.max(progressValues.length, 1),
  );
  const activeTrails = progressValues.filter((value) => value > 0).length;
  const roadmap = [t("roadmapItem1"), t("roadmapItem2"), t("roadmapItem3")];
  const signals = [
    {
      label: t("signalFoundationLabel"),
      value: t("signalFoundationValue"),
      icon: Trophy,
      tone: "border-amber-500/25 bg-amber-950/16",
    },
    {
      label: t("signalProgressLabel"),
      value: t("signalProgressValue", { value: `${averageProgress}%` }),
      icon: Target,
      tone: "border-sky-500/25 bg-sky-950/16",
    },
    {
      label: t("signalCadenceLabel"),
      value: t("signalCadenceValue"),
      icon: Sparkles,
      tone: "border-emerald-500/25 bg-emerald-950/16",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] md:px-8">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {t("heroPillPathways")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillGamified")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillProgressive")}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {t("pageTitle")}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              {t("pageSubtitle")}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 border-white/10 bg-white/[0.04]">
            <Trophy className="size-3" /> {t("badge")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {signals.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={`glass-panel card-shine rounded-3xl border px-5 py-4 shadow-none ring-0 ${tone}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {value}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-2 text-foreground">
                <Icon className="size-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <div className="grid gap-6 md:grid-cols-3">
        {trails.map((row) => {
          const progress = Number(row.progressPct) || 0;
          return (
            <Card
              key={row.title}
              className="glass-panel card-shine border-white/10 shadow-none ring-0 transition-colors hover:border-primary/25"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="w-fit border-primary/30 text-primary">
                    {row.level}
                  </Badge>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <CardTitle className="font-heading pt-2">{row.title}</CardTitle>
                <CardDescription className="leading-relaxed">{row.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("progress")}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/35 via-primary to-amber-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("nextStep")}</span>
                  <ArrowUpRight className="size-3.5 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>

        <Card className="glass-panel card-shine border-white/10 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="font-heading">{t("roadmapTitle")}</CardTitle>
            <CardDescription>{t("roadmapSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("summaryLabel")}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <p className="text-sm text-muted-foreground">{t("summaryTrails")}</p>
                  <p className="font-heading mt-1 text-3xl font-semibold tracking-tight">
                    {trails.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("summaryActive")}</p>
                  <p className="font-heading mt-1 text-3xl font-semibold tracking-tight">
                    {activeTrails}
                  </p>
                </div>
              </div>
            </div>
            {roadmap.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                  {item}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
