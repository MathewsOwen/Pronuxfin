# Fase 4 — E2E Playwright (web)

Objetivo: regressão automatizada das jornadas **públicas** e dos **guardrails de auth** no front-end Next.js, sem depender de corretora ou dados ao vivo no CI.

**Pré-requisitos:** Fases 0–3 · build do `web/` passando.

---

## 1. O que cobre

| Área | Spec | Verificação |
|------|------|-------------|
| Home | `e2e/home-public.spec.ts` | Hero, skip link, `#faq`, `#produto` |
| SEO | `e2e/seo-static.spec.ts` | `/sitemap.xml`, `/robots.txt`, rotas legais |
| Auth convidado | `e2e/auth-guest.spec.ts` | `/dashboard` e `/calendario` → `/login?from=…` |
| Bolsa mobile | `e2e/bolsa-mobile.spec.ts` | Cartões `md:hidden`, tabela `hidden md:block` |

Fluxos **logados** (watchlist, briefing, calendário com sessão) ficam para smoke manual ou futura suíte com Postgres + API no CI.

---

## 2. Comandos

```bash
# Uma vez: browsers
npm run test:e2e:install

# Build (recomendado antes do primeiro E2E)
cd web && npm run build && cd ..

# Servidor + testes (Playwright sobe `next start` na :3000)
npm run test:e2e

# Um comando na raiz (build + E2E)
JWT_SECRET=ci-placeholder-jwt-secret-min-32-characters-long \
DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/ci \
npm run test:e2e:ci

# UI mode (debug local)
npm run test:e2e --prefix web -- --ui
```

Variáveis úteis:

| Variável | Uso |
|----------|-----|
| `PLAYWRIGHT_BASE_URL` | URL base (default `http://127.0.0.1:3000`) |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `1` se o dev server já estiver a correr |
| `JWT_SECRET` | Mín. 32 chars — middleware de rotas privadas |

---

## 3. CI

O workflow `.github/workflows/ci.yml` inclui o job **`web-e2e`** após o job `web`: `npm ci` → Prisma → `playwright install chromium --with-deps` → `npm run build` → `npm run test:e2e`.

## 4. Release check (opt-in)

`npm run release:check` corre só `verify-env` + `validate`. Para incluir build do web e E2E:

```bash
npm run test:e2e:install
RELEASE_RUN_E2E=1 npm run release:check
```

(Defina `JWT_SECRET` e `DATABASE_URL` como no job `web` do CI, ou use o `.env.local` do `web/`.)

## 5. Próxima fase

**Fase 5** — go-live: `npm run release:check`, smoke produção, commit/push final. Ver [phase-5-go-live.md](./phase-5-go-live.md).
