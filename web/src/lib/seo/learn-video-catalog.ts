/**
 * Vídeos educacionais de canais oficiais / licenças abertas (Khan Academy, TED-Ed, B3).
 * Embeds via youtube-nocookie — sem reupload; atribuição ao canal original.
 */

export const LEARN_VIDEO_SLUGS = [
  "intro-acoes-khan",
  "comprar-acao-khan",
  "bolsa-ted-ed",
  "renda-fixa-b3",
  "diversificacao-khan",
  "juros-compostos-khan",
] as const;

export type LearnVideoSlug = (typeof LEARN_VIDEO_SLUGS)[number];

export type LearnVideoMeta = {
  youtubeId: string;
  channel: string;
  durationMinutes: number;
  license: "CC" | "TED-Ed" | "Official";
  level: "beginner" | "intermediate";
};

export const LEARN_VIDEO_META: Record<LearnVideoSlug, LearnVideoMeta> = {
  "intro-acoes-khan": {
    youtubeId: "dFinxAuqUAc",
    channel: "Khan Academy",
    durationMinutes: 8,
    license: "CC",
    level: "beginner",
  },
  "comprar-acao-khan": {
    youtubeId: "98qf7z8g1qY",
    channel: "Khan Academy",
    durationMinutes: 4,
    license: "CC",
    level: "beginner",
  },
  "bolsa-ted-ed": {
    youtubeId: "hZJbnjRh-Pk",
    channel: "TED-Ed",
    durationMinutes: 5,
    license: "TED-Ed",
    level: "beginner",
  },
  "renda-fixa-b3": {
    youtubeId: "pUOu1wvLjXI",
    channel: "B3 Oficial",
    durationMinutes: 6,
    license: "Official",
    level: "beginner",
  },
  "diversificacao-khan": {
    youtubeId: "ww9843G7FoM",
    channel: "Khan Academy",
    durationMinutes: 7,
    license: "CC",
    level: "intermediate",
  },
  "juros-compostos-khan": {
    youtubeId: "KyEqv8RvoMc",
    channel: "Khan Academy",
    durationMinutes: 6,
    license: "CC",
    level: "beginner",
  },
};

export function learnVideoEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}
