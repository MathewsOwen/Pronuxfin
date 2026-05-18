# PRONUXFIN — architecture overview

Monorepo for a **Next.js** public desk + private authenticated workspace, backed by a **NestJS** API and **PostgreSQL**.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ├─ Marketing / bolsa / tools (RSC + client islands)        │
│  └─ Private desk (AppShell, portfolio, alerts, IA)          │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
        ┌───────▼───────┐             ┌───────▼───────┐
        │  web/ Next.js │             │ backend/ Nest │
        │  /api/* BFF   │◄──API_URL──►│  /health/*    │
        │  Prisma (user)│             │  Postgres     │
        └───────┬───────┘             └───────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
 BRAPI      CoinGecko    FMP (optional)
```

## Packages

| Path | Role |
|------|------|
| `web/` | UI, `/api` routes, market gateway, auth cookies, Prisma for user data |
| `backend/` | Auth API, Postgres health, SMTP password reset, CORS |
| `scripts/` | `verify-env`, `smoke`, `release-readiness` |
| `docs/` | Phased go-live guides (0–5) |

## Key flows

1. **Quotes** — `GET /api/quotes` → `market-data-gateway` → BRAPI + CoinGecko; policy blocks silent simulation in production.
2. **Auth** — Register/login via web BFF; JWT shared with Nest; session cookie on web.
3. **Readiness** — `GET /api/health/ready` (web config + DB + API) and `GET /health/ready` (API DB).

## Phased maturity

See `docs/phases-0-1.md` through `docs/phase-5-go-live.md` for verification commands and go-live checklists.
