# Auditoria de segurança — PRONUXFIN (web + BFF)

Data: 2026-05-28. Escopo: páginas App Router, rotas `/api/*`, middleware, auth backend.

Legenda: **OK** | **MÉDIO** (melhoria) | **CORRIGIDO** nesta auditoria

---

## Resumo executivo

| Área | Estado |
|------|--------|
| Auth sessão (refresh rotativo, cookies HttpOnly) | OK |
| APIs `/api/user/*` | OK (401 sem sessão; queries com `userId`) |
| XSS (CSP nonce, JSON-LD escapado) | OK (enforcement em prod) |
| Open redirect pós-login | OK (`safeInternalRedirectPath`) |
| Rate limit auth + mercado | OK |
| BYOK (chaves IA cifradas) | OK |
| RS256 / Argon2id / cookies prefixados | OK (opt-in RS256; migração bcrypt→Argon2 no login) |
| CSRF (double-submit + `apiMutation`) | OK |
| Rotação de segredos (runbook) | OK — ver [SECURITY-OPERATIONS.md](./SECURITY-OPERATIONS.md) |
| Gestão de sessões (perfil) | OK — listar/revogar famílias refresh |
| `tokenVersion` validado no BFF | OK (opt-out `AUTH_SESSION_VERSION_CHECK=0`) |
| Refresh strict bind IP/UA | OK (opt-in `REFRESH_STRICT_BIND=1` no backend) |
| Rate limit mutações sensíveis | OK — perfil, BYOK, bulk carteira, sessões |
| WebAuthn 2FA + audit log + login alert | OK — ver P10 |

Correções aplicadas na auditoria:
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
