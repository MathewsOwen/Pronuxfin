import { describe, expect, it } from "vitest";

import { assertStrongProductionSecret } from "./secret-strength";

describe("secret-strength", () => {
  it("accepts high-entropy secrets", () => {
    expect(() =>
      assertStrongProductionSecret(
        "TEST",
        "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3",
      ),
    ).not.toThrow();
  });

  it("rejects repeated characters", () => {
    expect(() => assertStrongProductionSecret("TEST", "a".repeat(40))).toThrow(
      /weak/i,
    );
  });

  it("rejects obvious patterns", () => {
    expect(() =>
      assertStrongProductionSecret("TEST", "password-password-password-123456"),
    ).toThrow(/weak/i);
  });
});
