import { NextResponse } from "next/server";

import { jsonPayloadHeaders } from "@/lib/auth/forward-request-headers";
import { readRequestJson } from "@/lib/http/read-json-body";
import { apiBaseUrl, fetchAuthUpstream } from "@/lib/http/upstream-auth-fetch";

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

export async function forwardAuthPost(
  req: Request,
  upstreamPath: string,
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

  let upstream: Response;
  try {
    upstream = await fetchAuthUpstream(upstreamPath, {
      method: "POST",
      headers: jsonPayloadHeaders(req),
      body: JSON.stringify(parsedBody.value),
    });
  } catch {
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
