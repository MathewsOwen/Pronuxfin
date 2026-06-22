import { Play, ShieldCheck } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";

import { LearnVideoCard } from "@/components/learn/learn-video-card";
import {
  LEARN_VIDEO_LEVELS,
  LEARN_VIDEO_META,
  learnVideosByLevel,
  type LearnVideoLevel,
  type LearnVideoSlug,
} from "@/lib/seo/learn-video-catalog";

type VideoCard = {
  slug: LearnVideoSlug;
  title: string;
  description: string;
  channel: string;
  durationMinutes: number;
  license: string;
  level: LearnVideoLevel;
};

export async function LearnVideoSection() {
  const t = await getTranslations("Learn.videos");
  const messages = await getMessages();
  const learn = (messages as { Learn?: Record<string, unknown> }).Learn ?? {};
  const videosRaw =
    (learn.videos as Record<string, { title?: string; description?: string }>) ?? {};

  const cardsForLevel = (level: LearnVideoLevel): VideoCard[] =>
    learnVideosByLevel(level).map((slug) => {
      const meta = LEARN_VIDEO_META[slug];
      return {
        slug,
        title: videosRaw[slug]?.title ?? slug,
        description: videosRaw[slug]?.description ?? "",
        channel: meta.channel,
        durationMinutes: meta.durationMinutes,
        license: meta.license,
        level: meta.level,
      };
    });

  return (
    <section className="mt-16" aria-labelledby="learn-videos-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            {t("eyebrow")}
          </p>
          <h2 id="learn-videos-heading" className="font-heading mt-2 text-2xl font-semibold">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("lead")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] text-primary">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          {t("licenseBadge")}
        </div>
      </div>

      {LEARN_VIDEO_LEVELS.map((level) => (
        <div key={level} className="mt-10">
          <h3 className="font-heading text-xl font-semibold">{t(`track_${level}`)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t(`track_${level}_lead`)}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {cardsForLevel(level).map((card) => {
              const meta = LEARN_VIDEO_META[card.slug];
              return (
                <LearnVideoCard
                  key={card.slug}
                  youtubeId={meta.youtubeId}
                  title={card.title}
                  description={card.description}
                  channel={card.channel}
                  durationMinutes={card.durationMinutes}
                  levelLabel={t(`level_${card.level}`)}
                  sourceAttribution={t("sourceAttribution", {
                    channel: card.channel,
                    license: card.license,
                  })}
                />
              );
            })}
          </div>
        </div>
      ))}

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </section>
  );
}
