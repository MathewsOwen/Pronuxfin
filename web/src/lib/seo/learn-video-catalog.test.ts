import { describe, expect, it } from "vitest";
import {
  LEARN_VIDEO_SLUGS,
  resolveLearnVideoSource,
} from "@/lib/seo/learn-video-catalog";

describe("learn-video-catalog", () => {
  it("resolves a source for every slug in each language", () => {
    for (const slug of LEARN_VIDEO_SLUGS) {
      for (const lang of ["en", "pt", "es"] as const) {
        const resolved = resolveLearnVideoSource(slug, lang);
        expect(resolved, `${slug} / ${lang}`).not.toBeNull();
        expect(resolved!.source.youtubeId.length).toBeGreaterThan(5);
      }
    }
  });

  it("prefers Portuguese sources when available", () => {
    const pt = resolveLearnVideoSource("renda-fixa-b3", "pt");
    expect(pt?.resolvedLanguage).toBe("pt");
    expect(pt?.source.channel).toContain("Me Poupe");
  });
});
