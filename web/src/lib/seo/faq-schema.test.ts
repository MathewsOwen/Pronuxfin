import { describe, expect, it } from "vitest";

import { buildFaqPageJsonLd } from "./faq-schema";

describe("buildFaqPageJsonLd", () => {
  it("builds FAQPage schema with questions", () => {
    const json = buildFaqPageJsonLd(
      [
        { question: "Q1?", answer: "A1." },
        { question: "Q2?", answer: "A2." },
      ],
      "https://example.com/",
    );

    expect(json["@type"]).toBe("FAQPage");
    expect(json.mainEntity).toHaveLength(2);
    expect(json.mainEntity[0]?.name).toBe("Q1?");
    expect(json.mainEntity[0]?.acceptedAnswer.text).toBe("A1.");
    expect(json.url).toBe("https://example.com/");
  });
});
