import { NextResponse } from "next/server";

import { secureAuthCookie } from "@/lib/auth/cookie-settings";

import { AUTH_COOKIE } from "@/lib/constants";

import { jsonPayloadHeaders } from "@/lib/auth/forward-request-headers";

import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";

import { attachRequestId } from "@/lib/http/request-id";

import {

  authRateLimitedResponse,

  getRateLimitClientKey,

  rateLimitLogin,

} from "@/lib/security/auth-rate-limit";



export async function POST(req: Request) {

  const clientKey = getRateLimitClientKey(req);

  const limited = rateLimitLogin(clientKey);

  if (!limited.ok) {

    return attachRequestId(

      req,

      authRateLimitedResponse(limited.retryAfterSec, "AUTH_RATE_LIMIT_LOGIN"),

    );

  }



  const apiUrl = process.env.API_URL;

  if (!apiUrl) {

    return attachRequestId(

      req,

      NextResponse.json(

        {

          message: "API_URL is not configured on this server.",

          code: "API_MISCONFIGURED",

        },

        { status: 500 },

      ),

    );

  }



  const body = await req.json();

  const res = await fetch(`${apiUrl}/auth/login`, {

    method: "POST",

    headers: jsonPayloadHeaders(req),

    body: JSON.stringify(body),

  });



  const data = (await res.json().catch(() => ({}))) as Record<

    string,

    unknown

  > & { access_token?: string };



  if (!res.ok) {

    const { message, code } = normalizeUpstreamAuthError(

      data,

      "Unable to sign in.",

    );

    return attachRequestId(

      req,

      NextResponse.json(

        { message, ...(code ? { code } : {}) },

        { status: res.status },

      ),

    );

  }



  const token = data.access_token;

  if (!token || typeof token !== "string") {

    return attachRequestId(

      req,

      NextResponse.json(

        {

          message: "Upstream auth response missing token.",

          code: "INVALID_AUTH_RESPONSE",

        },

        { status: 502 },

      ),

    );

  }



  const response = NextResponse.json({ ok: true });

  response.cookies.set(AUTH_COOKIE, token, {

    httpOnly: true,

    secure: secureAuthCookie(),

    sameSite: "lax",

    path: "/",

    maxAge: Number(process.env.JWT_COOKIE_MAX_AGE ?? 604800),

  });

  return attachRequestId(req, response);

}


