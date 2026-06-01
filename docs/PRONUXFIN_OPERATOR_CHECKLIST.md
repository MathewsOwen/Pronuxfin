# PRONUXFIN — checklist do operador (go-live 10/10)

O que **não está no código**: contas, chaves e variáveis de ambiente. Use este guia para **zero tela de manutenção** e site completo.

---

## Passo 0 — Gerar segredos (1 minuto)

Na raiz do repo:

```bash
npm run production:setup
```

Abre `.env.production.generated` (não vai para o Git). Preencha os campos `<<< MANUAL >>>` e valide:

```bash
npm run production:verify -- .env.production.generated
```

Só faça deploy quando o verify terminar com **OK**.

---

## 1. Contas e alojamento

| O quê | Onde | Notas |
|--------|------|--------|
| Frontend Next.js | **Vercel** | Root directory = `web`, região `gru1` |
| API NestJS | **Render / Railway / VPS** | HTTPS público (ex.: `api.pronuxfin.com.br`) |
| PostgreSQL | **Neon / Supabase / RDS** | Mesma base para backend + Next (Prisma) |
| Domínio | **Registro.br** | `www.pronuxfin.com.br` → CNAME Vercel |

---

## 2. Vercel — variáveis obrigatórias (Production)

Sem **todas** estas, o painel privado mostra **manutenção** ou o servidor falha no arranque.

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.pronuxfin.com.br` |
| `API_URL` | `https://api.pronuxfin.com.br` (sem `/` final) |
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_ALGORITHM` | `RS256` |
| `JWT_PUBLIC_KEY` | PEM pública (só no web) |
| `INTERNAL_API_SECRET` | ≥32 chars, **igual ao backend** |
| `CSRF_ENFORCE` | `1` |
| `AUTH_SESSION_VERSION_CHECK` | `1` |
| `COOKIE_SAMESITE_STRICT` | `1` |
| `CSP_MODE` | `enforce` |
| `AI_KEYS_ENCRYPTION_KEY` | 64 caracteres hex |
| `WEBAUTHN_RP_ID` | `www.pronuxfin.com.br` |
| `WEBAUTHN_ORIGIN` | `https://www.pronuxfin.com.br` |
| `OPENAI_API_KEY` **ou** `GEMINI_API_KEY` | Pelo menos um motor de IA |

**Recomendado (mesa ao vivo + dossiê):**

| Variável | Efeito |
|----------|--------|
| `BRAPI_TOKEN` | Cotações B3 estáveis |
| `FMP_API_KEY` | Dossiê internacional (TTM, demonstrações) |
| `HEALTH_PROBE_SECRET` | Probes detalhados em `/api/health/ready` |
| `SECURITY_CONTACT_EMAIL` | `security.txt` |
| `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` | Alertas de erro |

**Proibido:** `MAINTENANCE_FORCE_OFF=1`, `CSRF_ENFORCE=0`, `MARKET_ALLOW_SIMULATION=1`.

---

## 3. Backend — variáveis obrigatórias

| Variável | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Igual ao web |
| `JWT_ALGORITHM` | `RS256` |
| `JWT_PRIVATE_KEY` | PEM privada (**só backend**) |
| `JWT_PUBLIC_KEY` | PEM pública |
| `INTERNAL_API_SECRET` | Igual ao web |
| `REFRESH_STRICT_BIND` | `1` |
| `FRONTEND_URL` | `https://www.pronuxfin.com.br` |
| `FRONTEND_URLS` | `https://pronuxfin.com.br,https://pronuxfin.vercel.app` |
| `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN` | Igual ao web |
| `TRUST_PROXY` | `1` (atrás de proxy/CDN) |
| `SMTP_URL` + `SMTP_FROM` | Reset de senha por e-mail |
| `PLATFORM_ADMIN_EMAILS` | Seu e-mail admin |

---

## 4. Ordem de deploy

1. Criar PostgreSQL e correr `npm run migrate:deploy`
2. Deploy backend com env do bloco BACKEND
3. Confirmar `GET https://api…/health/ready` → 200
4. Colar env WEB na Vercel → **Redeploy**
5. Apontar DNS `www` → Vercel
6. Smoke: `WEB_BASE=https://www.pronuxfin.com.br npm run smoke:strict`

---

## 5. Verificação manual (10/10)

- [ ] Home, bolsa, notícias, projeção, ferramentas — sem erro
- [ ] Registo + login — **sem** tela de manutenção
- [ ] Dashboard, carteira, alertas carregam
- [ ] Chat de mercado responde (IA)
- [ ] Ativo B3 e internacional com cotações reais
- [ ] Recuperação de senha por e-mail
- [ ] `/privacidade` e `/termos` acessíveis

---

Docs relacionados: `docs/deploy-passo-a-passo.md`, `docs/PRODUCTION-SECURITY-CHECKLIST.md`, `web/DEPLOY.md`.
