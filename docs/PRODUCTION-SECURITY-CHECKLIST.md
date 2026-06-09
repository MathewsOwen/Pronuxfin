# Checklist de segurança — produção PRONUXFIN

Use este documento antes de abrir o site ao público. **Nenhum sistema é invulnerável**, mas este checklist cobre as defesas implementadas no código + infra obrigatória.

---

## 1. Gerar segredos

```bash
node scripts/generate-production-secrets.mjs
```

Copie os valores para o password manager. **Nunca** commite `.env` no Git.

---

## 2. Web (Vercel / Next.js)

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `JWT_ALGORITHM` | `RS256` | Sim |
| `JWT_PUBLIC_KEY` | PEM (só pública) | Sim |
| `INTERNAL_API_SECRET` | ≥32 chars (igual ao backend) | Sim |
| `INTERNAL_API_REQUEST_SIGNING` | `1` | Sim |
| `PASSWORD_BREACH_CHECK` | `1` (HIBP k-anonymity) | Sim |
| `API_URL` | URL interna/privada do Nest | Sim |
| `DATABASE_URL` | PostgreSQL | Sim |
| `NEXT_PUBLIC_SITE_URL` | `https://seu-dominio.com` | Sim |
| `CSRF_ENFORCE` | `1` | Sim |
| `AUTH_SESSION_VERSION_CHECK` | `1` | Sim |
| `COOKIE_SAMESITE_STRICT` | `1` | Sim |
| `CSP_MODE` | `enforce` | Sim |
| `AI_KEYS_ENCRYPTION_KEY` | 64 hex chars | Sim (BYOK) |
| `HEALTH_PROBE_SECRET` | string longa | Sim |

**Proibido em produção:** `CSRF_ENFORCE=0`, `AUTH_SESSION_VERSION_CHECK=0`, `MAINTENANCE_FORCE_OFF=1`, `CSP_MODE=off`, `MARKET_ALLOW_SIMULATION=1`.

O servidor **não arranca** se algum item crítico falhar (`instrumentation.ts`).

---

## 3. Backend (NestJS — rede privada)

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `JWT_ALGORITHM` | `RS256` | Sim |
| `JWT_PRIVATE_KEY` | PEM (só no backend) | Sim |
| `JWT_PUBLIC_KEY` | PEM | Sim |
| `INTERNAL_API_SECRET` | igual ao web | Sim |
| `INTERNAL_API_REQUEST_SIGNING` | `1` | Sim |
| `REFRESH_STRICT_BIND` | `1` | Sim |
| `MAX_REFRESH_FAMILIES_PER_USER` | `8` (recomendado) | Sim |
| `PASSWORD_BREACH_CHECK` | `1` | Sim |
| `FRONTEND_URL` | origem do site | Sim |
| `DATABASE_URL` | PostgreSQL | Sim |
| `SMTP_URL` + `SMTP_FROM` | e-mail transacional | Sim |
| `WEBAUTHN_RP_ID` | hostname | Passkeys |
| `WEBAUTHN_ORIGIN` | `https://…` sem `/` final | Passkeys |
| `PLATFORM_ADMIN_IP_ALLOWLIST` | IP(s) fixos do admin (opcional) | Recomendado |

**A API Nest não deve estar exposta na internet pública** — apenas o BFF Next acede com **assinatura HMAC** (não envia o segredo raw em produção).

---

## 4. Infraestrutura (fora do código)

- [ ] **WAF / Cloudflare** na frente do domínio (DDoS, bot, geo)
- [ ] Backend numa **VPC / rede privada** (Railway private network, Render internal, etc.)
- [ ] **HTTPS** em todo o tráfego (HSTS preload activo no Next)
- [ ] **Backups** PostgreSQL encriptados + teste de restore
- [ ] **Sentry** (`NEXT_PUBLIC_SENTRY_DSN`) para alertas de erro
- [ ] Submeter domínio a [hstspreload.org](https://hstspreload.org) após 2 semanas estável

---

## 5. Verificação pós-deploy

```bash
# Repo
npm run release:check

# Smoke produção
WEB_BASE=https://www.seudominio.com.br \
HEALTH_PROBE_SECRET=… \
npm run smoke:strict
```

Manual:
1. Login → cookie `pronuxfin_csrf` + mutação com header `x-csrf-token`
2. Chamada directa ao Nest `/auth/login` sem assinatura HMAC válida → **401**
3. Registo com senha conhecida em breach (ex. `Password123!`) → **400** `PASSWORD_BREACH_BLOCKED`
4. Perfil → passkey + revogar sessões
5. `GET /api/health/market` sem header interno → resposta mínima (sem capabilities)

---

## 6. Resposta a incidentes

Ver [SECURITY-OPERATIONS.md](./SECURITY-OPERATIONS.md): rotação de `INTERNAL_API_SECRET`, incremento `tokenVersion`, revogação refresh tokens.

Contacto de segurança: configure `SECURITY_CONTACT_EMAIL` no web (`.well-known/security.txt`).
