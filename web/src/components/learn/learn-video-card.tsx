"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import {
  learnVideoEmbedUrl,
  learnVideoThumbnailUrl,
} from "@/lib/seo/learn-video-catalog";
import { cn } from "@/lib/utils";

type LearnVideoCardProps = {
  youtubeId: string;
  title: string;
  description: string;
  channel: string;
  durationMinutes: number;
  levelLabel: string;
  sourceAttribution: string;
  languageNote?: string;
};

export function LearnVideoCard({
  youtubeId,
  title,
  description,
  channel,
  durationMinutes,
  levelLabel,
  sourceAttribution,
  languageNote,
}: LearnVideoCardProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="glass-panel overflow-hidden rounded-3xl border border-white/12">
      <div className="relative aspect-video w-full bg-black/40">
        {playing ? (
          <iframe
            src={`${learnVideoEmbedUrl(youtubeId)}&autoplay=1`}
            title={title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex w-full items-center justify-center"
            aria-label={title}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail YouTube oficial */}
            <img
              src={learnVideoThumbnailUrl(youtubeId)}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
              loading="lazy"
              decoding="async"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
            <span
              className={cn(
                "relative flex size-14 items-center justify-center rounded-full border border-white/25",
                "bg-primary/90 text-primary-foreground shadow-lg transition-transform group-hover:scale-105",
              )}
            >
              <Play className="size-6 fill-current pl-0.5" aria-hidden />
            </span>
          </button>
        )}
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
            <Play className="size-3" aria-hidden />
            {levelLabel}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {durationMinutes} min · {channel}
          </span>
        </div>
        <h3 className="font-heading mt-3 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {languageNote ? (
          <p className="mt-2 text-xs text-primary/80">{languageNote}</p>
        ) : null}
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {sourceAttribution}
        </p>
      </div>
    </article>
  );
}
