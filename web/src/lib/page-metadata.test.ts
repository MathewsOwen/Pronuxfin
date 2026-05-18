import { afterEach, describe, expect, it, vi } from "vitest";

import {
  defaultOpenGraphImages,
  marketingMetadata,
  privateAppMetadata,
} from "./page-metadata";

describe("page-metadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds default OG/Twitter images for marketing pages", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.pronuxfin.com.br");
    const meta = marketingMetadata({
      pathname: "/bolsa",
      title: "Bolsa",
      description: "Mesa ao vivo",
    });
    expect(JSON.stringify(defaultOpenGraphImages())).toContain("/opengraph-image");
    expect(meta.openGraph?.images).toBeDefined();
    expect(meta.twitter?.images).toEqual(["https://www.pronuxfin.com.br/opengraph-image"]);
  });

  it("blocks indexing for private app routes", () => {
    const meta = privateAppMetadata({
      pathname: "/dashboard",
      title: "Painel",
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});
