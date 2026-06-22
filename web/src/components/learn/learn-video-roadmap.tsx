"use client";

import { Globe2, GraduationCap, Layers } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { LearnVideoCard } from "@/components/learn/learn-video-card";
import {
  LEARN_VIDEO_LEVELS,
  LEARN_VIDEO_LANGUAGES,
  localeToVideoLanguage,
  type LearnVideoLanguage,
  type LearnVideoLevel,
  type LearnVideoSlug,
} from "@/lib/seo/learn-video-catalog";
import { cn } from "@/lib/utils";

export type LearnVideoRoadmapItem = {
  slug: LearnVideoSlug;
  title: string;
  description: string;
  level: LearnVideoLevel;
  roadmapOrder: number;
  youtubeId: string;
  channel: string;
  durationMinutes: number;
  license: string;
  resolvedLanguage: LearnVideoLanguage;
  requestedLanguage: LearnVideoLanguage;
};

type LevelFilter = LearnVideoLevel | "all";

export function LearnVideoRoadmap({ items }: { items: LearnVideoRoadmapItem[] }) {
  const t = useTranslations("Learn.videos");
  const siteLocale = useLocale();
  const [language, setLanguage] = useState<LearnVideoLanguage>(() =>
    localeToVideoLanguage(siteLocale),
  );
  const [level, setLevel] = useState<LevelFilter>("all");

  const filtered = useMemo(() => {
    const byLang = items.filter((item) => item.requestedLanguage === language);
    if (level === "all") return byLang;
    return byLang.filter((item) => item.level === level);
  }, [items, language, level]);

  const countsByLevel = useMemo(() => {
    const langItems = items.filter((i) => i.requestedLanguage === language);
    return {
      all: langItems.length,
      beginner: langItems.filter((i) => i.level === "beginner").length,
      intermediate: langItems.filter((i) => i.level === "intermediate").length,
      advanced: langItems.filter((i) => i.level === "advanced").length,
    };
  }, [items, language]);

  const levelOptions: { id: LevelFilter; count: number }[] = [
    { id: "all", count: countsByLevel.all },
    ...LEARN_VIDEO_LEVELS.map((id) => ({ id, count: countsByLevel[id] })),
  ];

  return (
    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="glass-panel shrink-0 rounded-3xl border border-white/12 p-5 lg:sticky lg:top-24 lg:w-64">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="size-4" aria-hidden />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{t("roadmapNav")}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe2 className="size-3.5" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {t("filterLanguage")}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 lg:flex-col">
            {LEARN_VIDEO_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  language === lang
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20",
                )}
              >
                {t(`language_${lang}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="size-3.5" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {t("filterLevel")}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {levelOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLevel(opt.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  level === opt.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20",
                )}
              >
                <span>{opt.id === "all" ? t("filterAll") : t(`level_${opt.id}`)}</span>
                <span className="font-mono text-[10px] opacity-70">{opt.count}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t("roadmapHint")}</p>
      </aside>

      <div className="min-w-0 flex-1">
        {filtered.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/12 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("noVideosForFilter")}</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filtered.map((card, index) => (
              <div key={`${card.slug}-${card.requestedLanguage}`} className="relative">
                <span className="absolute -left-1 top-4 z-10 hidden font-mono text-[10px] text-primary/80 lg:block">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <LearnVideoCard
                  youtubeId={card.youtubeId}
                  title={card.title}
                  description={card.description}
                  channel={card.channel}
                  durationMinutes={card.durationMinutes}
                  levelLabel={t(`level_${card.level}`)}
                  sourceAttribution={t("sourceAttribution", {
                    channel: card.channel,
                    license: card.license,
                  })}
                  languageNote={
                    card.resolvedLanguage !== card.requestedLanguage
                      ? t("audioFallback", {
                          language: t(`language_${card.resolvedLanguage}`),
                        })
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
