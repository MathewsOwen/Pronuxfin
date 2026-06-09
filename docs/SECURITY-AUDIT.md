# Auditoria de segurança — PRONUXFIN (web + BFF)

Data: 2026-05-29. Escopo: páginas App Router, rotas `/api/*`, middleware, auth backend.

Legenda: **OK** | **MÉDIO** (melhoria) | **CORRIGIDO** nesta auditoria

---

## Resumo executivo

| Área | Estado |
|------|--------|
| Auth sessão (refresh rotativo, cookies HttpOnly) | OK |
| APIs `/api/user/*` | OK (401 sem sessão; queries com `userId`; rate limit em mutações) |
| XSS (CSP nonce, JSON-LD escapado) | OK (enforcement em prod) |
| Open redirect pós-login | OK (`safeInternalRedirectPath`) |
| Rate limit auth + mercado | OK (Postgres distribuído; auth fail-closed) |
| BYOK (chaves IA cifradas) | OK |
| RS256 / Argon2id / cookies prefixados | OK (opt-in RS256; migração bcrypt→Argon2 no login) |
| CSRF (double-submit + `apiMutation`) | OK |
| BFF auth validation (Zod server-side) | OK |
| SSRF (DNS rebinding + redirects bloqueados) | OK |
| Backend isolado (`INTERNAL_API_SECRET`) | OK (HMAC signing em prod; raw header só dev) |
| WebAuthn amarrado ao JWT | OK |
| Revogação de sessão unificada | OK (`tokenVersion` + upstream no middleware) |
| Startup fail-fast produção | OK (`instrumentation.ts`) |
| Rotação de segredos (runbook) | OK — ver [SECURITY-OPERATIONS.md](./SECURITY-OPERATIONS.md) |
| Gestão de sessões (perfil) | OK — listar/revogar famílias refresh |
| `tokenVersion` validado no BFF | OK (opt-out proibido em prod) |
| Refresh strict bind IP/UA | OK (obrigatório em prod no backend) |
| Rate limit mutações sensíveis | OK — perfil, BYOK, carteira, watchlist, rotas, IA |
| WebAuthn 2FA + audit log + login alert | OK — ver P10 |

Correções aplicadas (2026-06-01 — nível Big Tech):
- **Assinatura HMAC BFF→Nest:** cada pedido interno leva `x-internal-timestamp`, `x-internal-body-sha256` e `x-internal-signature` (anti-replay ±120s); o segredo raw **não** trafega em produção.
- **HIBP (Have I Been Pwned):** registo/reset bloqueiam senhas em breach conhecidas (k-anonymity, fail-open em falha de rede); audit `PASSWORD_BREACH_BLOCKED`.
- **Admin IP allowlist:** logins de contas em `PLATFORM_ADMIN_EMAILS` podem exigir IP em `PLATFORM_ADMIN_IP_ALLOWLIST`; audit `ADMIN_IP_DENIED`.
- **Boot fail-fast:** `INTERNAL_API_REQUEST_SIGNING=1` obrigatório em web + backend.

Correções aplicadas (2026-06-03 — nível enterprise):
- **Lockout de login:** após 8 falhas / 15 min → bloqueio 30 min (`AUTH_ACCOUNT_LOCKED`); audit `ACCOUNT_LOCKOUT`.
- **Senha forte:** mínimo 12 chars + 3 classes (maiúsc/minúsc/número/símbolo) + blocklist comum (registo/reset).
- **Sessões:** máx. 8 famílias refresh activas por utilizador (`MAX_REFRESH_FAMILIES_PER_USER`).
- **API Nest:** audit `INTERNAL_API_PROBE_FAILED` em tentativas sem/forged `x-internal-auth`.
- **Segredos:** validação de entropia em `INTERNAL_API_SECRET` + `HEALTH_PROBE_SECRET` no boot web.
- **CSP:** `form-action 'self'`, `frame-src 'none'`, `media-src 'self'`.
- **Backend:** middleware de headers de segurança + `X-Powered-By` desactivado.

Correções aplicadas (2026-06-03 — elevação adicional):
- **BFF → Nest:** encaminha `X-Forwarded-For` + `User-Agent` do cliente (REFRESH_STRICT_BIND eficaz).
- **DoS:** limites de corpo JSON em todas as mutações de utilizador (16–256 KB conforme rota).
- **Produção:** `API_URL`, `NEXT_PUBLIC_SITE_URL` e `WEBAUTHN_ORIGIN` devem ser HTTPS; `DATABASE_URL` obrigatório.
- **Backend:** `TRUST_PROXY=1`, WebAuthn e HSTS via Helmet; `/health` resumo mínimo sem probe interno.
- **Proxy:** bloqueia métodos `TRACE`/`TRACK`/`CONNECT` em `/api/*`.
- **Health ready:** rate limit + comparação timing-safe do `HEALTH_PROBE_SECRET`.

Correções aplicadas (2026-06-03):
- **Backend:** `InternalApiGuard` global (`APP_GUARD`) — `/auth/*` bloqueado sem `x-internal-auth`; só `/health/*` é `@PublicRoute()`.
- **Backend:** throttle em `/health/live` e `/health/ready`; SMTP obrigatório no boot de produção.
- **Backend:** CORS sem fallback `localhost` em `NODE_ENV=production`.
- **Web:** comparação timing-safe de `INTERNAL_API_SECRET` (`secure-compare.ts`) em probes internos.
- **Web:** headers de segurança em todas as respostas `/api/*` (proxy + `next.config`).
- **Web:** `HEALTH_PROBE_SECRET` obrigatório no fail-fast de produção.
- **Web:** rate limits públicos e CSP report fail-open (disponibilidade sem abrir brute-force em auth).

Correções aplicadas (2026-05-30):
- Quotes/lookup migrados para rate limit **Postgres distribuído** (fail-closed em prod).
- Mutações exigem **`Content-Type: application/json`** (415 se inválido).
- **`/api/auth/refresh`**: rate limit + validação same-origin no GET (middleware redirect).
- Headers de segurança em respostas API via `applyApiSecurityHeaders`.
- HSTS com **`preload`** (2 anos).
- JWT RS256 suportado no fail-fast de produção (`JWT_PUBLIC_KEY`).

Correções aplicadas (2026-05-29):
- Rate limits **fail-closed** em auth, mutações de utilizador e `/api/market-ai`.
- Validação **Zod server-side** em todas as rotas auth do BFF antes de forward ao Nest.
- **DNS rebinding** bloqueado em fetches de mercado/RSS (`assertSafeFetchTarget`).
- **`instrumentation.ts`** falha no boot se env de produção estiver fraca.
- **`REFRESH_STRICT_BIND=1`** obrigatório no backend em produção.
- Rate limits distribuídos em portfolio, watchlist, compound-scenarios, financial-routes.
- Headers adicionais: `X-Permitted-Cross-Domain-Policies`, `Origin-Agent-Cluster`.

Correções anteriores (2026-05-28):
- `/api/market-ai` validava JWT só com HS256 → agora usa `verifyAccessJwt` (RS256 compatível).
- Links `website` do dossiê aceitavam esquemas perigosos → `safeExternalUrl`.
- `POST /api/quotes/lookup/batch` exige sessão + rate limit por `userId`.
- Links RSS de notícias passam por `safeExternalUrl` (itens inválidos ficam `#` e são filtrados no dedup).

---

## Páginas públicas (sem login obrigatório)

| Rota | Auth | XSS / redirect | Notas |
|------|------|----------------|-------|
| `/` (home) | — | OK | JSON-LD com nonce; intro scripts com nonce |
| `/login` | — | OK | `from` sanitizado; rate limit distribuído |
| `/register` | — | OK | Sem auto-login (anti-enumeração) |
| `/forgot-password` | — | OK | Rate limit |
| `/reset-password` | — | OK | Token só no body; não logado |
| `/bolsa` | — | OK | Dados mercado públicos; sem PII |
| `/noticias` | — | OK | Links RSS com `rel=noopener noreferrer` |
| `/ferramentas` | — | OK | |
| `/ferramentas/juros-compostos` | — | OK | |
| `/ferramentas/calendario` | — | OK | Calendário macro público |
| `/projecao` | Opcional | OK | Hub público; CTA login |
| `/termos`, `/privacidade` | — | OK | Conteúdo estático i18n |

---

## Painel privado `(app)/` — dupla barreira

1. **Middleware**: JWT/refresh nas rotas `/dashboard`, `/assistant`, `/education`, `/compare`, `/alerts`, `/ativo`, `/carteira`, `/calendario`, `/rota`, `/perfil`.
2. **Layout `(app)`**: `getCurrentUser()` + redirect `/login?from=…`.

| Rota | IDOR / dados | Notas |
|------|----------------|-------|
| `/dashboard` | OK | SSR com `user.id`; dossières só símbolos válidos |
| `/assistant` | OK | UI; inferência via `/api/market-ai` autenticada |
| `/education` | OK | |
| `/compare` | OK | Símbolos normalizados |
| `/alerts` | OK | Watchlist do utilizador |
| `/ativo/[symbol]` | OK | `^[A-Z0-9.-]{1,16}$`; redirect se sem dossier |
| `/carteira` | OK | Posições scoped `userId` |
| `/calendario` | OK | Rotas financeiras + sync alertas no SSR |
| `/rota` | OK | GPS patrimonial |
| `/perfil` | OK | PATCH perfil + BYOK |

`localePrefix: never` — paths sem `/pt-BR/`, alinhado com `protectedPrefixes`.

---

## APIs

### Auth (`/api/auth/*`)

| Rota | Proteção | Notas |
|------|----------|-------|
| login, register, forgot, reset | Rate limit DB + upstream secret | BFF → Nest com `x-internal-auth` |
| refresh GET/POST | Cookie refresh path `/api/auth` | Redirect `from` sanitizado |
| logout | OK | Revoga upstream + limpa cookies legado |

### Utilizador (`/api/user/*`)

Todas exigem `requireSessionUser()` (matriz de testes 401). Mutations Prisma incluem `userId` — **sem IDOR** observado.

| Rota | Extra |
|------|-------|
| `ai-keys` | Cifra AES-256-GCM; nunca devolve plaintext |
| `financial-routes` GET | Sem escrita (corrigido) |
| `portfolio/bulk` | Limite de posições no servidor |

### Mercado público

| Rota | Auth | Rate limit | Notas |
|------|------|------------|-------|
| `/api/quotes` | — | IP | |
| `/api/quotes/lookup` | — | IP | |
| `/api/quotes/lookup/batch` | Sessão | userId + IP | Batch 1 BRAPI + 1 Yahoo/região |
| `/api/news` | — | Sim | |
| `/api/quotes/sector`, `crypto-sector` | — | Sim | |

### IA

| Rota | Auth | Notas |
|------|------|-------|
| `/api/market-ai` | Sessão JWT | Rate limit 12/min/user; mensagens truncadas; **CORRIGIDO** verify RS256 |

### Saúde / segurança

| Rota | Notas |
|------|-------|
| `/api/health/ready` | Detalhe só com `HEALTH_PROBE_SECRET` |
| `/api/security/csp-report` | Body limit 100KB; rate limit |

---

## Backend Nest (resumo)

- `/auth/*` guardado por `InternalApiGuard` em produção.
- Refresh rotativo + detecção de reuso.
- `tokenVersion` no JWT + invalidação global.
- CORS allowlist explícita (não `*`).
- Senhas: Argon2id novas; bcrypt legado com upgrade no login.

---

## P9 — Sessões e endurecimento extra (2026-05-28)

- **Perfil → Sessões ativas**: `GET /api/user/sessions`, revogar dispositivo, terminar todas (`tokenVersion` + refresh revogados).
- **BFF**: access JWT comparado com `User.tokenVersion` em cada `requireSessionUser()`.
- **Backend**: `REFRESH_STRICT_BIND=1` revoga família se IP ou User-Agent mudar no refresh.
- **Cookies**: `COOKIE_SAMESITE_STRICT=1` aplica `SameSite=Strict` só no refresh.
- **Logout**: `Clear-Site-Data: "cookies"` em HTTPS.
- **Headers**: `Cross-Origin-Resource-Policy: same-site`.

## P10 — Enterprise (2026-05-28)

| Recurso | Estado |
|---------|--------|
| WebAuthn / passkeys (2FA após password) | OK |
| E-mail novo dispositivo (`AUTH_LOGIN_NOTIFY`, SMTP) | OK |
| Audit log `SecurityEvent` + UI em Perfil | OK |
| RS256 + `REFRESH_STRICT_BIND` (advisory em readiness) | OK — ver `evaluateEnterpriseSecurityHints()` |

---

## CSRF e operações (implementado)

- Cookie `pronuxfin_csrf` + header `x-csrf-token` em rotas mutáveis autenticadas; auth entry valida `Origin`/`Sec-Fetch-Site`.
- Cliente: `apiMutation()` em formulários e painel (watchlist, carteira, alertas, IA, rotas financeiras, auth).
- Runbook de rotação: [SECURITY-OPERATIONS.md](./SECURITY-OPERATIONS.md).

---

## Checklist pós-deploy

- [ ] `INTERNAL_API_SECRET` igual em web + backend
- [ ] `npm run migrate:deploy` (backend + web — refresh tokens, rate limit, P10 WebAuthn/audit)
- [ ] `CSP_MODE=report-only` → monitorar → `enforce`
- [ ] `npm run csp:check` no staging
- [ ] RS256: `JWT_PUBLIC_KEY` no web, `JWT_PRIVATE_KEY` só no backend
- [ ] `REFRESH_STRICT_BIND=1` no backend
- [ ] `WEBAUTHN_RP_ID` + `WEBAUTHN_ORIGIN` + SMTP (`AUTH_LOGIN_NOTIFY=1`)
- [ ] Smoke P10: passkey, sessões, registo de segurança, email novo dispositivo
- [ ] `AI_KEYS_ENCRYPTION_KEY` 64 hex em produção se BYOK ativo
