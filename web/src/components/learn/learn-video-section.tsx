import { ShieldCheck } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";

import {
  LearnVideoRoadmap,
  type LearnVideoRoadmapItem,
} from "@/components/learn/learn-video-roadmap";
import {
  LEARN_VIDEO_LANGUAGES,
  LEARN_VIDEO_META,
  LEARN_VIDEO_SLUGS,
  resolveLearnVideoSource,
  type LearnVideoSlug,
} from "@/lib/seo/learn-video-catalog";

export async function LearnVideoSection() {
  const t = await getTranslations("Learn.videos");
  const messages = await getMessages();
  const learn = (messages as { Learn?: Record<string, unknown> }).Learn ?? {};
  const videosRaw =
    (learn.videos as Record<string, { title?: string; description?: string }>) ?? {};

  const items: LearnVideoRoadmapItem[] = [];

  for (const language of LEARN_VIDEO_LANGUAGES) {
    for (const slug of LEARN_VIDEO_SLUGS) {
      const resolved = resolveLearnVideoSource(slug, language);
      if (!resolved) continue;
      const meta = LEARN_VIDEO_META[slug];
      items.push({
        slug,
        title: videosRaw[slug]?.title ?? slug,
        description: videosRaw[slug]?.description ?? "",
        level: meta.level,
        roadmapOrder: meta.roadmapOrder,
        youtubeId: resolved.source.youtubeId,
        channel: resolved.source.channel,
        durationMinutes: resolved.source.durationMinutes,
        license: resolved.source.license,
        resolvedLanguage: resolved.resolvedLanguage,
        requestedLanguage: language,
      });
    }
  }

  items.sort((a, b) => a.roadmapOrder - b.roadmapOrder);

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
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("roadmapLead")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] text-primary">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          {t("licenseBadge")}
        </div>
      </div>

      <LearnVideoRoadmap items={items} />

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </section>
  );
}
