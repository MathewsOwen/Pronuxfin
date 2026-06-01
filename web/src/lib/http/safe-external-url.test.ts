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

  it("blocks private IP literals", () => {
    expect(safeExternalUrl("http://127.0.0.1/")).toBeNull();
    expect(safeExternalUrl("http://169.254.169.254/")).toBeNull();
  });

  it("adds https when missing", () => {
    expect(safeExternalUrl("example.com")).toBe("https://example.com/");
  });
});
