import { describe, expect, it } from "vitest";

import {
  buildInternalApiSignaturePayload,
  hashInternalRequestBody,
  signInternalApiRequest,
} from "./internal-api-signature";

describe("internal-api-signature", () => {
  const secret = "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3";

  it("produces stable headers for the same payload", () => {
    const body = JSON.stringify({ email: "a@b.com", password: "x" });
    const a = signInternalApiRequest({
      method: "POST",
      path: "/auth/login",
      body,
      secret,
    });
    const b = signInternalApiRequest({
      method: "POST",
      path: "/auth/login",
      body,
      secret,
    });
    expect(a["x-internal-body-sha256"]).toBe(b["x-internal-body-sha256"]);
    expect(a["x-internal-signature"]).toBe(b["x-internal-signature"]);
  });

  it("changes signature when body changes", () => {
    const a = signInternalApiRequest({
      method: "POST",
      path: "/auth/login",
      body: '{"a":1}',
      secret,
    });
    const b = signInternalApiRequest({
      method: "POST",
      path: "/auth/login",
      body: '{"a":2}',
      secret,
    });
    expect(a["x-internal-signature"]).not.toBe(b["x-internal-signature"]);
  });

  it("hashes empty body consistently", () => {
    expect(hashInternalRequestBody("")).toHaveLength(64);
    expect(
      buildInternalApiSignaturePayload({
        timestampSec: 1,
        method: "GET",
        path: "/auth/me",
        bodySha256: hashInternalRequestBody(""),
      }),
    ).toBe("1\nGET\n/auth/me\n" + hashInternalRequestBody(""));
  });
});
