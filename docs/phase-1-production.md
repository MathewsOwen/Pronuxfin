# Fase 1 — Produção confiável

Objetivo: stack estável para utilizadores reais — readiness rigoroso, degradação honesta, SMTP/CORS alinhados, observabilidade básica.

**Pré-requisito:** [Fase 0 — smoke test](./smoke-test.md) (`npm run test`, `npm run smoke`).

---

## 1. Variáveis obrigatórias (go-live)

### Vercel (`web`)

| Variável | Critério |
|----------|----------|
| `API_URL` | HTTPS da API Nest |
| `JWT_SECRET` | ≥ 32 caracteres, **igual** ao backend |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site |
| `DATABASE_URL` | Postgres (watchlist, carteira, BYOK) |

### Backend (Render / Docker / VM)

| Variável | Critério |
|----------|----------|
| `DATABASE_URL` | Postgres acessível |
| `JWT_SECRET` | Igual ao web |
| `FRONTEND_URL` | Origem principal do Next (ex. `https://www.pronuxfin.com.br`) |
| `FRONTEND_URLS` | (opcional) Apex + preview Vercel, separados por vírgula |
| `SMTP_URL` + `SMTP_FROM` | Obrigatório em produção para reset de senha |
| `NODE_ENV` | `production` |

Em produção **não** use `AUTH_RESET_DEV_LOG_ONLY=true` — o backend regista erro no arranque se SMTP faltar.

---

## 2. Readiness e manutenção

| Endpoint | Função |
|----------|--------|
| `GET /api/health` | Liveness do Next |
| `GET /api/health/ready` | Readiness completo (503 se algo falhar) |
| `GET /health` (API) | Resumo + `capabilities.password_reset` |
| `GET /health/ready` (API) | Postgres up |

Com `HEALTH_PROBE_SECRET` no web, `GET /api/health/ready` com header `Authorization: Bearer <secret>` devolve o objeto `checks` detalhado.

**Painel privado:** em `NODE_ENV=production`, o gate distingue dois níveis:

- **Crítico (manutenção):** variáveis estáticas em falta — `API_URL`, `NEXT_PUBLIC_SITE_URL`, `JWT` (RS256 + `JWT_PUBLIC_KEY`), `DATABASE_URL`, `INTERNAL_API_SECRET`, `COOKIE_SAMESITE_STRICT`, `AI_KEYS_ENCRYPTION_KEY`, `WEBAUTHN_*`, motor de IA (`OPENAI_API_KEY` / `GEMINI_API_KEY`). O painel privado mostra `MaintenanceLockScreen` listando o que falta; páginas públicas seguem ao vivo.
- **Runtime (degradação):** backend Nest a inicializar ou base temporariamente fora. Banner âmbar; painel continua navegável.

Gere e valide env antes do deploy: `npm run production:setup` → `npm run production:verify -- .env.production.generated`.

**Banner âmbar:** API fora do ar ou em warm-up — painel continua acessível com aviso (JWT local).

---

## 3. SMTP (recuperação de senha)

1. Criar conta no provedor (SendGrid, SES, Resend, etc.).
2. Definir no backend:
   - `SMTP_URL=smtps://user:pass@host:465`
   - `SMTP_FROM="PRONUXFIN <no-reply@seudominio.com>"`
3. Garantir `FRONTEND_URL` = URL onde o utilizador abre o site (link no e-mail).
4. Validar:
   - `GET https://<api>/health` → `capabilities.password_reset: true`, `password_reset_mode: "smtp"`
5. Testar fluxo: `/forgot-password` → e-mail → `/reset-password?token=...`

---

## 4. CORS

O backend aceita:

- `FRONTEND_URL` (origem principal)
- Todas as entradas em `FRONTEND_URLS` (lista separada por vírgula ou `;`)

Exemplo produção:

```env
FRONTEND_URL=https://www.pronuxfin.com.br
FRONTEND_URLS=https://pronuxfin.com.br,https://pronuxfin.vercel.app
```

---

## 5. Smoke pós-deploy

```bash
WEB_BASE=https://www.seudominio.com.br \
API_BASE=https://api.seudominio.com.br \
EXPECT_PASSWORD_RESET=1 \
npm run smoke:strict
```

Windows:

```powershell
$env:WEB_BASE="https://www.seudominio.com.br"
$env:API_BASE="https://api.seudominio.com.br"
$env:EXPECT_PASSWORD_RESET="1"
npm run smoke:strict
```

Critério: **sem FAIL**; em produção **sem WARN** em `/api/health/ready`.

Opcional (exige SMTP em produção):

```bash
EXPECT_PASSWORD_RESET=1 API_BASE=... ./scripts/smoke.sh
```

---

## 6. Sentry (recomendado)

- `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` na Vercel
- Tags de degradação: `platform.degraded_bucket` (`frontend_jwt_misconfigured`, `backend_connectivity`, etc.)

---

## 7. Checklist rápido

- [ ] Migrações Prisma no Postgres de produção
- [ ] `GET /api/health/ready` → 200
- [ ] `GET /health/ready` na API → 200
- [ ] `capabilities.password_reset_mode` = `smtp`
- [ ] Registo + login + dashboard sem manutenção
- [ ] Reset de senha por e-mail
- [ ] Smoke manual secções 3–5 em [`smoke-test.md`](./smoke-test.md)

---

## Próxima fase

**Fase 2 — Dados reais:** `BRAPI_TOKEN`, `FMP_API_KEY`, reduzir fallback simulado na mesa.
