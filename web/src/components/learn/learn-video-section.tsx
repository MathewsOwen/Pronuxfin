import { Play, ShieldCheck } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";

import {
  LEARN_VIDEO_META,
  LEARN_VIDEO_SLUGS,
  learnVideoEmbedUrl,
  type LearnVideoSlug,
} from "@/lib/seo/learn-video-catalog";

type VideoCard = {
  slug: LearnVideoSlug;
  title: string;
  description: string;
  channel: string;
  durationMinutes: number;
  license: string;
  level: string;
};

export async function LearnVideoSection() {
  const t = await getTranslations("Learn.videos");
  const messages = await getMessages();
  const learn = (messages as { Learn?: Record<string, unknown> }).Learn ?? {};
  const videosRaw =
    (learn.videos as Record<string, { title?: string; description?: string }>) ?? {};

  const cards: VideoCard[] = LEARN_VIDEO_SLUGS.map((slug) => {
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {cards.map((card) => {
          const meta = LEARN_VIDEO_META[card.slug];
          return (
            <article
              key={card.slug}
              className="glass-panel overflow-hidden rounded-3xl border border-white/12"
            >
              <div className="relative aspect-video w-full bg-black/40">
                <iframe
                  src={learnVideoEmbedUrl(meta.youtubeId)}
                  title={card.title}
                  className="absolute inset-0 size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                    <Play className="size-3" aria-hidden />
                    {t(`level_${card.level}` as "level_beginner")}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {card.durationMinutes} min · {card.channel}
                  </span>
                </div>
                <h3 className="font-heading mt-3 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("sourceAttribution", { channel: card.channel, license: card.license })}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </section>
  );
}
