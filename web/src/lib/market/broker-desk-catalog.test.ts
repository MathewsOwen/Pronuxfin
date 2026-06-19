import { describe, expect, it } from "vitest";

import {
  getBrokerLiquidityLeaders,
  getBrokerTrustLeaders,
} from "@/lib/market/broker-desk-catalog";
import { LEARN_VIDEO_SLUGS } from "@/lib/seo/learn-video-catalog";

describe("broker-desk-catalog", () => {
  it("returns top 10 liquidity leaders", () => {
    const leaders = getBrokerLiquidityLeaders(10);
    expect(leaders).toHaveLength(10);
    expect(leaders[0]?.id).toBe("XP");
  });

  it("returns curated trust picks", () => {
    const trusted = getBrokerTrustLeaders();
    expect(trusted.length).toBeGreaterThanOrEqual(3);
    expect(trusted.every((b) => b.trustScore >= 4)).toBe(true);
  });
});

describe("learn-video-catalog", () => {
  it("has more than the original six lessons", () => {
    expect(LEARN_VIDEO_SLUGS.length).toBeGreaterThanOrEqual(18);
  });
});
