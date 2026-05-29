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

## Source-of-truth boundaries

- **Auth ownership**: credential validation, token issuing and password recovery are owned by `backend/`.  
  `web/` acts as a BFF/proxy for browser-safe cookies and request normalization.
- **User data ownership**: while both `web/` and `backend/` currently touch Postgres, product behavior should not diverge.  
  Any new user-domain write flow must define a single owner service before implementation.
- **Generated artifacts**: native mobile generated assets (`capacitor-cordova-*`, `android/.../assets/public/assets`, `ios/.../public/assets`) are build outputs, not business source.
- **Side projects** (NEXUS, Grafyco, planilhas, ONG, etc.): **outside this repo** — separate folders or GitHub repos; see root `.gitignore`.

## Repo hygiene guardrail

- Run `npm run repo:hygiene` before opening PRs that touch architecture or project structure.
- Use strict mode in CI with `npm run repo:hygiene:strict`.

## Key flows

1. **Quotes** — `GET /api/quotes` → `market-data-gateway` → BRAPI + CoinGecko; policy blocks silent simulation in production.
2. **Auth** — Register/login via web BFF; JWT shared with Nest; session cookie on web.
3. **Readiness** — `GET /api/health/ready` (web config + DB + API) and `GET /health/ready` (API DB).

## Phased maturity

See `docs/phases-0-1.md` through `docs/phase-5-go-live.md` for verification commands and go-live checklists.
