# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` (latest deploy) | Yes |

## Reporting a vulnerability

**Do not** open public GitHub issues for security-sensitive reports.

1. Email the maintainers via the contact channel published on your PRONUXFIN deployment.
2. Include steps to reproduce, impact, and affected URLs or API routes.
3. Allow reasonable time to patch before disclosure.

We aim to acknowledge reports within **5 business days** and ship fixes or mitigations as soon as practical.

## Scope

In scope:

- Authentication, session handling, and authorization on `web/` and `backend/`
- Injection, SSRF, or secret exposure in production code paths
- Misconfiguration that exposes private desk data publicly

Out of scope:

- Social engineering, denial-of-service without a reproducible flaw
- Issues in third-party APIs (BRAPI, FMP, CoinGecko, SMTP providers)

## Secure development

- Run `npm run validate` before merging
- Never commit `.env`, API keys, or production `DATABASE_URL`
- Use `npm run smoke:strict` against staging/production after deploy
