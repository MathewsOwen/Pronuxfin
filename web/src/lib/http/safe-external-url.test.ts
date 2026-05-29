import { describe, expect, it } from "vitest";
import { safeExternalUrl } from "./safe-external-url";

describe("safeExternalUrl", () => {
  it("allows https URLs", () => {
    expect(safeExternalUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("blocks javascript scheme", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("adds https when missing", () => {
    expect(safeExternalUrl("example.com")).toBe("https://example.com/");
  });
});
