#!/usr/bin/env node
const SITE = (
  process.env.SITE ??
  process.env.WEB_BASE ??
  "https://www.pronuxfin.com.br"
).replace(/\/+$/, "");

async function post(path, body, extraHeaders = {}) {
  const res = await fetch(`${SITE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: SITE,
      Referer: `${SITE}/pt-BR/register`,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, json };
}

const password = "Magiluka2024!Fin";
const email = `probe-${Date.now()}@example.com`;

console.log("Site:", SITE, "\n");

const withoutTerms = await post("/api/auth/register", {
  email,
  password,
  name: "Probe User",
});
console.log("Register WITHOUT acceptTerms:", withoutTerms.status, withoutTerms.json);

const withTerms = await post("/api/auth/register", {
  email: `probe2-${Date.now()}@example.com`,
  password,
  name: "Probe User",
  acceptTerms: true,
});
console.log("Register WITH acceptTerms:", withTerms.status, withTerms.json);

const forgot = await post("/api/auth/forgot-password", {
  email: "matheusdiniziphone@gmail.com",
});
console.log("Forgot password:", forgot.status, forgot.json);
