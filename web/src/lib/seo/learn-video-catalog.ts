/**
 * Vídeos educacionais de canais oficiais / licenças abertas (Khan Academy, TED-Ed, B3).
 * Embeds via youtube-nocookie — sem reupload; atribuição ao canal original.
 */

export const LEARN_VIDEO_SLUGS = [
  // Iniciante
  "intro-acoes-khan",
  "comprar-acao-khan",
  "bolsa-ted-ed",
  "renda-fixa-b3",
  "juros-compostos-khan",
  "intro-titulos-khan",
  "acoes-vs-titulos-khan",
  "inflacao-khan",
  "cripto-basico-ted",
  // Intermediário
  "diversificacao-khan",
  "fundos-investimento-khan",
  "pe-ratio-khan",
  "eps-lucro-khan",
  "selic-juros-khan",
  "carteira-allocation-khan",
  // Avançado
  "enterprise-value-khan",
  "opcoes-intro-khan",
  "black-scholes-khan",
  "shorting-acoes-khan",
] as const;

export type LearnVideoSlug = (typeof LEARN_VIDEO_SLUGS)[number];

export type LearnVideoLevel = "beginner" | "intermediate" | "advanced";

export type LearnVideoMeta = {
  youtubeId: string;
  channel: string;
  durationMinutes: number;
  license: "CC" | "TED-Ed" | "Official";
  level: LearnVideoLevel;
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
  "juros-compostos-khan": {
    youtubeId: "KyEqv8RvoMc",
    channel: "Khan Academy",
    durationMinutes: 6,
    license: "CC",
    level: "beginner",
  },
  "intro-titulos-khan": {
    youtubeId: "Qh-M3_L4xYk",
    channel: "Khan Academy",
    durationMinutes: 9,
    license: "CC",
    level: "beginner",
  },
  "acoes-vs-titulos-khan": {
    youtubeId: "rs1md3e4aYU",
    channel: "Khan Academy",
    durationMinutes: 9,
    license: "CC",
    level: "beginner",
  },
  "inflacao-khan": {
    youtubeId: "-Z5kkfrEc8I",
    channel: "Khan Academy",
    durationMinutes: 9,
    license: "CC",
    level: "beginner",
  },
  "cripto-basico-ted": {
    youtubeId: "bBC-nXCEgvk",
    channel: "TED-Ed",
    durationMinutes: 6,
    license: "TED-Ed",
    level: "beginner",
  },
  "diversificacao-khan": {
    youtubeId: "ww9843G7FoM",
    channel: "Khan Academy",
    durationMinutes: 7,
    license: "CC",
    level: "intermediate",
  },
  "fundos-investimento-khan": {
    youtubeId: "_ZJary7yZyU",
    channel: "Khan Academy",
    durationMinutes: 10,
    license: "CC",
    level: "intermediate",
  },
  "pe-ratio-khan": {
    youtubeId: "cppxO67e6eo",
    channel: "Khan Academy",
    durationMinutes: 6,
    license: "CC",
    level: "intermediate",
  },
  "eps-lucro-khan": {
    youtubeId: "RGVn2BLMj04",
    channel: "Khan Academy",
    durationMinutes: 5,
    license: "CC",
    level: "intermediate",
  },
  "selic-juros-khan": {
    youtubeId: "18-xiC7ffjM",
    channel: "Khan Academy",
    durationMinutes: 7,
    license: "CC",
    level: "intermediate",
  },
  "carteira-allocation-khan": {
    youtubeId: "0wgiwe2IbOA",
    channel: "Khan Academy",
    durationMinutes: 12,
    license: "CC",
    level: "intermediate",
  },
  "enterprise-value-khan": {
    youtubeId: "vNUO7Vhu3v4",
    channel: "Khan Academy",
    durationMinutes: 8,
    license: "CC",
    level: "advanced",
  },
  "opcoes-intro-khan": {
    youtubeId: "N8h45mDI80s",
    channel: "Khan Academy",
    durationMinutes: 10,
    license: "CC",
    level: "advanced",
  },
  "black-scholes-khan": {
    youtubeId: "pr-u4LCFYEY",
    channel: "Khan Academy",
    durationMinutes: 10,
    license: "CC",
    level: "advanced",
  },
  "shorting-acoes-khan": {
    youtubeId: "MXTLdHHH-ao",
    channel: "Khan Academy",
    durationMinutes: 8,
    license: "CC",
    level: "advanced",
  },
};

export const LEARN_VIDEO_LEVELS: LearnVideoLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export function learnVideosByLevel(level: LearnVideoLevel): LearnVideoSlug[] {
  return LEARN_VIDEO_SLUGS.filter((slug) => LEARN_VIDEO_META[slug].level === level);
}

export function learnVideoEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}
