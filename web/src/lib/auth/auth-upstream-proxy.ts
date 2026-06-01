import { NextResponse } from "next/server";
import type { z } from "zod";

import { jsonPayloadHeaders } from "@/lib/auth/forward-request-headers";
import { readRequestJson } from "@/lib/http/read-json-body";
import {
  apiBaseUrl,
  AuthUpstreamTimeoutError,
  fetchAuthUpstream,
} from "@/lib/http/upstream-auth-fetch";

type ForwardAuthPostResult =
  | {
      error: NextResponse;
      upstream?: undefined;
      data?: undefined;
    }
  | {
      error?: undefined;
      upstream: Response;
      data: Record<string, unknown>;
    };

function validationError(): NextResponse {
  return NextResponse.json(
    { message: "Invalid request body.", code: "VALIDATION_FAILED" },
    { status: 400 },
  );
}

export async function forwardAuthPost(
  req: Request,
  upstreamPath: string,
  schema?: z.ZodTypeAny,
): Promise<ForwardAuthPostResult> {
  if (!apiBaseUrl()) {
    return {
      error: NextResponse.json(
        {
          message: "API_URL is not configured on this server.",
          code: "API_MISCONFIGURED",
        },
        { status: 500 },
      ),
    };
  }

  const parsedBody = await readRequestJson(req);
  if (!parsedBody.ok) {
    return { error: parsedBody.response };
  }

  let payload: Record<string, unknown>;
  if (schema) {
    const validated = schema.safeParse(parsedBody.value);
    if (!validated.success) {
      return { error: validationError() };
    }
    payload = validated.data as Record<string, unknown>;
  } else {
    payload =
      typeof parsedBody.value === "object" && parsedBody.value !== null
        ? (parsedBody.value as Record<string, unknown>)
        : {};
  }

  let upstream: Response;
  try {
    upstream = await fetchAuthUpstream(upstreamPath, {
      method: "POST",
      headers: jsonPayloadHeaders(req),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof AuthUpstreamTimeoutError) {
      return {
        error: NextResponse.json(
          {
            message:
              "The authentication service is taking too long to respond. Please try again.",
            code: "UPSTREAM_TIMEOUT",
          },
          { status: 504 },
        ),
      };
    }
    return {
      error: NextResponse.json(
        { message: "Auth service unavailable.", code: "UPSTREAM_UNAVAILABLE" },
        { status: 502 },
      ),
    };
  }

  const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
  return { upstream, data };
}
