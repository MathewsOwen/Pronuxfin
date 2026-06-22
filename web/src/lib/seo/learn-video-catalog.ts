/**
 * Roadmap de vídeos educacionais — fontes oficiais / licença aberta.
 * IDs verificados via YouTube oEmbed; embed via youtube-nocookie.
 */

export const LEARN_VIDEO_SLUGS = [
  "intro-acoes-khan",
  "comprar-acao-khan",
  "bolsa-ted-ed",
  "renda-fixa-b3",
  "juros-compostos-khan",
  "intro-titulos-khan",
  "acoes-vs-titulos-khan",
  "inflacao-khan",
  "cripto-basico-ted",
  "diversificacao-khan",
  "fundos-investimento-khan",
  "pe-ratio-khan",
  "eps-lucro-khan",
  "selic-juros-khan",
  "carteira-allocation-khan",
  "enterprise-value-khan",
  "opcoes-intro-khan",
  "black-scholes-khan",
  "shorting-acoes-khan",
] as const;

export type LearnVideoSlug = (typeof LEARN_VIDEO_SLUGS)[number];

export type LearnVideoLevel = "beginner" | "intermediate" | "advanced";

export const LEARN_VIDEO_LANGUAGES = ["en", "pt", "es"] as const;
export type LearnVideoLanguage = (typeof LEARN_VIDEO_LANGUAGES)[number];

export type LearnVideoLicense = "CC" | "TED-Ed" | "Official";

export type LearnVideoSource = {
  youtubeId: string;
  channel: string;
  durationMinutes: number;
  license: LearnVideoLicense;
};

export type LearnVideoTopicMeta = {
  level: LearnVideoLevel;
  /** Ordem no roadmap (menor = mais básico). */
  roadmapOrder: number;
  sources: Partial<Record<LearnVideoLanguage, LearnVideoSource>>;
};

export const LEARN_VIDEO_META: Record<LearnVideoSlug, LearnVideoTopicMeta> = {
  "intro-acoes-khan": {
    level: "beginner",
    roadmapOrder: 10,
    sources: {
      en: {
        youtubeId: "rs1md3e4aYU",
        channel: "Khan Academy",
        durationMinutes: 9,
        license: "CC",
      },
      pt: {
        youtubeId: "khToouRsNts",
        channel: "Nord Wealth",
        durationMinutes: 18,
        license: "Official",
      },
      es: {
        youtubeId: "rs1md3e4aYU",
        channel: "Khan Academy",
        durationMinutes: 9,
        license: "CC",
      },
    },
  },
  "comprar-acao-khan": {
    level: "beginner",
    roadmapOrder: 20,
    sources: {
      en: {
        youtubeId: "98qfFzqDKR8",
        channel: "Khan Academy",
        durationMinutes: 5,
        license: "CC",
      },
      pt: {
        youtubeId: "khToouRsNts",
        channel: "Nord Wealth",
        durationMinutes: 18,
        license: "Official",
      },
      es: {
        youtubeId: "98qfFzqDKR8",
        channel: "Khan Academy",
        durationMinutes: 5,
        license: "CC",
      },
    },
  },
  "bolsa-ted-ed": {
    level: "beginner",
    roadmapOrder: 30,
    sources: {
      en: {
        youtubeId: "p7HKvqRI_Bo",
        channel: "TED-Ed",
        durationMinutes: 5,
        license: "TED-Ed",
      },
      pt: {
        youtubeId: "V0yXw5Xi9YY",
        channel: "B3",
        durationMinutes: 4,
        license: "Official",
      },
      es: {
        youtubeId: "p7HKvqRI_Bo",
        channel: "TED-Ed",
        durationMinutes: 5,
        license: "TED-Ed",
      },
    },
  },
  "renda-fixa-b3": {
    level: "beginner",
    roadmapOrder: 40,
    sources: {
      en: {
        youtubeId: "Qh-M3_L4xYk",
        channel: "Khan Academy",
        durationMinutes: 8,
        license: "CC",
      },
      pt: {
        youtubeId: "bolG9pgxEAU",
        channel: "Me Poupe!",
        durationMinutes: 18,
        license: "Official",
      },
      es: {
        youtubeId: "Qh-M3_L4xYk",
        channel: "Khan Academy",
        durationMinutes: 8,
        license: "CC",
      },
    },
  },
  "juros-compostos-khan": {
    level: "beginner",
    roadmapOrder: 50,
    sources: {
      en: {
        youtubeId: "Rm6UdfRs3gw",
        channel: "Khan Academy",
        durationMinutes: 7,
        license: "CC",
      },
      pt: {
        youtubeId: "Y8uEV0o66iM",
        channel: "Khan Academy em Português",
        durationMinutes: 12,
        license: "CC",
      },
      es: {
        youtubeId: "Rm6UdfRs3gw",
        channel: "Khan Academy",
        durationMinutes: 7,
        license: "CC",
      },
    },
  },
  "intro-titulos-khan": {
    level: "beginner",
    roadmapOrder: 60,
    sources: {
      en: {
        youtubeId: "Qh-M3_L4xYk",
        channel: "Khan Academy",
        durationMinutes: 8,
        license: "CC",
      },
      pt: {
        youtubeId: "bolG9pgxEAU",
        channel: "Me Poupe!",
        durationMinutes: 18,
        license: "Official",
      },
      es: {
        youtubeId: "Qh-M3_L4xYk",
        channel: "Khan Academy",
        durationMinutes: 8,
        license: "CC",
      },
    },
  },
  "acoes-vs-titulos-khan": {
    level: "beginner",
    roadmapOrder: 70,
    sources: {
      en: {
        youtubeId: "rs1md3e4aYU",
        channel: "Khan Academy",
        durationMinutes: 9,
        license: "CC",
      },
      pt: {
        youtubeId: "fclslgHuF6k",
        channel: "Nord Wealth",
        durationMinutes: 22,
        license: "Official",
      },
      es: {
        youtubeId: "rs1md3e4aYU",
        channel: "Khan Academy",
        durationMinutes: 9,
        license: "CC",
      },
    },
  },
  "inflacao-khan": {
    level: "beginner",
    roadmapOrder: 80,
    sources: {
      en: {
        youtubeId: "-Z5kkfrEc8I",
        channel: "Khan Academy",
        durationMinutes: 9,
        license: "CC",
      },
      pt: {
        youtubeId: "-Z5kkfrEc8I",
        channel: "Khan Academy",
        durationMinutes: 9,
        license: "CC",
      },
      es: {
        youtubeId: "-Z5kkfrEc8I",
        channel: "Khan Academy",
        durationMinutes: 9,
        license: "CC",
      },
    },
  },
  "cripto-basico-ted": {
    level: "beginner",
    roadmapOrder: 90,
    sources: {
      en: {
        youtubeId: "SSo_EIwHSd4",
        channel: "Simply Explained",
        durationMinutes: 6,
        license: "CC",
      },
      pt: {
        youtubeId: "SSo_EIwHSd4",
        channel: "Simply Explained",
        durationMinutes: 6,
        license: "CC",
      },
      es: {
        youtubeId: "SSo_EIwHSd4",
        channel: "Simply Explained",
        durationMinutes: 6,
        license: "CC",
      },
    },
  },
  "diversificacao-khan": {
    level: "intermediate",
    roadmapOrder: 110,
    sources: {
      en: {
        youtubeId: "jhvCc5tKAno",
        channel: "Khan Academy",
        durationMinutes: 3,
        license: "CC",
      },
      pt: {
        youtubeId: "41pFUGgJ33U",
        channel: "BB Investimentos",
        durationMinutes: 14,
        license: "Official",
      },
      es: {
        youtubeId: "jhvCc5tKAno",
        channel: "Khan Academy",
        durationMinutes: 3,
        license: "CC",
      },
    },
  },
  "fundos-investimento-khan": {
    level: "intermediate",
    roadmapOrder: 120,
    sources: {
      en: {
        youtubeId: "_ZJary7yZyU",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
      pt: {
        youtubeId: "_ZJary7yZyU",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
      es: {
        youtubeId: "_ZJary7yZyU",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
    },
  },
  "pe-ratio-khan": {
    level: "intermediate",
    roadmapOrder: 130,
    sources: {
      en: {
        youtubeId: "cppxO67e6eo",
        channel: "Khan Academy",
        durationMinutes: 6,
        license: "CC",
      },
      pt: {
        youtubeId: "cppxO67e6eo",
        channel: "Khan Academy",
        durationMinutes: 6,
        license: "CC",
      },
      es: {
        youtubeId: "cppxO67e6eo",
        channel: "Khan Academy",
        durationMinutes: 6,
        license: "CC",
      },
    },
  },
  "eps-lucro-khan": {
    level: "intermediate",
    roadmapOrder: 140,
    sources: {
      en: {
        youtubeId: "7MjHWw3p710",
        channel: "Khan Academy",
        durationMinutes: 6,
        license: "CC",
      },
      pt: {
        youtubeId: "7MjHWw3p710",
        channel: "Khan Academy",
        durationMinutes: 6,
        license: "CC",
      },
      es: {
        youtubeId: "7MjHWw3p710",
        channel: "Khan Academy",
        durationMinutes: 6,
        license: "CC",
      },
    },
  },
  "selic-juros-khan": {
    level: "intermediate",
    roadmapOrder: 150,
    sources: {
      en: {
        youtubeId: "GtaoP0skPWc",
        channel: "Khan Academy",
        durationMinutes: 5,
        license: "CC",
      },
      pt: {
        youtubeId: "Y8uEV0o66iM",
        channel: "Khan Academy em Português",
        durationMinutes: 12,
        license: "CC",
      },
      es: {
        youtubeId: "GtaoP0skPWc",
        channel: "Khan Academy",
        durationMinutes: 5,
        license: "CC",
      },
    },
  },
  "carteira-allocation-khan": {
    level: "intermediate",
    roadmapOrder: 160,
    sources: {
      en: {
        youtubeId: "0wgiwe2IbOA",
        channel: "ETF Education",
        durationMinutes: 12,
        license: "CC",
      },
      pt: {
        youtubeId: "41pFUGgJ33U",
        channel: "BB Investimentos",
        durationMinutes: 14,
        license: "Official",
      },
      es: {
        youtubeId: "0wgiwe2IbOA",
        channel: "ETF Education",
        durationMinutes: 12,
        license: "CC",
      },
    },
  },
  "enterprise-value-khan": {
    level: "advanced",
    roadmapOrder: 210,
    sources: {
      en: {
        youtubeId: "5lmHzAHbtzg",
        channel: "Khan Academy",
        durationMinutes: 5,
        license: "CC",
      },
      pt: {
        youtubeId: "5lmHzAHbtzg",
        channel: "Khan Academy",
        durationMinutes: 5,
        license: "CC",
      },
      es: {
        youtubeId: "5lmHzAHbtzg",
        channel: "Khan Academy",
        durationMinutes: 5,
        license: "CC",
      },
    },
  },
  "opcoes-intro-khan": {
    level: "advanced",
    roadmapOrder: 220,
    sources: {
      en: {
        youtubeId: "N8h45mDI80s",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
      pt: {
        youtubeId: "N8h45mDI80s",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
      es: {
        youtubeId: "N8h45mDI80s",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
    },
  },
  "black-scholes-khan": {
    level: "advanced",
    roadmapOrder: 230,
    sources: {
      en: {
        youtubeId: "pr-u4LCFYEY",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
      pt: {
        youtubeId: "pr-u4LCFYEY",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
      es: {
        youtubeId: "pr-u4LCFYEY",
        channel: "Khan Academy",
        durationMinutes: 10,
        license: "CC",
      },
    },
  },
  "shorting-acoes-khan": {
    level: "advanced",
    roadmapOrder: 240,
    sources: {
      en: {
        youtubeId: "-IDmLERenrU",
        channel: "Khan Academy",
        durationMinutes: 8,
        license: "CC",
      },
      pt: {
        youtubeId: "-IDmLERenrU",
        channel: "Khan Academy",
        durationMinutes: 8,
        license: "CC",
      },
      es: {
        youtubeId: "-IDmLERenrU",
        channel: "Khan Academy",
        durationMinutes: 8,
        license: "CC",
      },
    },
  },
};

export const LEARN_VIDEO_LEVELS: LearnVideoLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export function localeToVideoLanguage(locale: string): LearnVideoLanguage {
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("es")) return "es";
  return "en";
}

export function resolveLearnVideoSource(
  slug: LearnVideoSlug,
  language: LearnVideoLanguage,
): { source: LearnVideoSource; resolvedLanguage: LearnVideoLanguage } | null {
  const meta = LEARN_VIDEO_META[slug];
  const direct = meta.sources[language];
  if (direct) return { source: direct, resolvedLanguage: language };
  const en = meta.sources.en;
  if (en) return { source: en, resolvedLanguage: "en" };
  for (const lang of LEARN_VIDEO_LANGUAGES) {
    const fallback = meta.sources[lang];
    if (fallback) return { source: fallback, resolvedLanguage: lang };
  }
  return null;
}

export function learnVideosByLevel(level: LearnVideoLevel): LearnVideoSlug[] {
  return LEARN_VIDEO_SLUGS.filter((slug) => LEARN_VIDEO_META[slug].level === level).sort(
    (a, b) => LEARN_VIDEO_META[a].roadmapOrder - LEARN_VIDEO_META[b].roadmapOrder,
  );
}

export function listRoadmapVideoSlugs(opts?: {
  level?: LearnVideoLevel | "all";
}): LearnVideoSlug[] {
  const slugs =
    opts?.level && opts.level !== "all"
      ? learnVideosByLevel(opts.level)
      : [...LEARN_VIDEO_SLUGS];
  return slugs.sort(
    (a, b) => LEARN_VIDEO_META[a].roadmapOrder - LEARN_VIDEO_META[b].roadmapOrder,
  );
}

export function learnVideoEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}

export function learnVideoThumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}
