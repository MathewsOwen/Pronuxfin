# Deploy PRONUXFIN — passo a passo (por partes)

Guia prático para chegar a **`https://www.pronuxfin.com.br`** com a API em HTTPS e utilizadores a conseguir registar/login. Faz **uma parte de cada vez**; não precisas de fechar tudo no mesmo dia.

Referências rápidas no repo:

- Variáveis de exemplo: `web/.env.example`, `backend/.env.example`, `docker-compose.env.example`
- Checklist resumido: `docs/github-production-checklist.md` (secção 12 = o que não está no Git)
- Deploy só do front: `web/DEPLOY.md`

---

## Parte 1 — Contas e repositório

**O que és:** garantir que o código está no GitHub e que tens contas nos serviços.

1. **GitHub**  
   O projeto já está num repositório. Confirma que a branch principal é `main` e que o CI está verde (badge ou **Actions** no GitHub).

2. **Conta Vercel**  
   Cria em [vercel.com](https://vercel.com) (podes usar “Sign up with GitHub”).

3. **Domínio**  
   O domínio `pronuxfin.com.br` deve estar **no teu controlo** (ex.: Registro.br, Cloudflare, GoDaddy). Vais precisar de aceder ao painel de **DNS** mais tarde (Parte 6).

**Quando considerar a Parte 1 feita:** tens login Vercel + login no sítio do domínio + repo no GitHub.

---

## Parte 2 — Base de dados (PostgreSQL)

**O que és:** um Postgres **acessível pela internet** (ou na mesma rede privada que a API, se for tudo na mesma VPS). O Nest usa `DATABASE_URL`.

1. **Escolhe um fornecedor** (exemplos: Neon, Supabase, RDS, ElephantSQL, ou Postgres numa VPS).  
2. **Cria a base** e um utilizador com permissões de leitura/escrita.  
3. **Copia a connection string** (formato `postgresql://user:pass@host:5432/dbname?...`).  
   - Se o fornecedor oferecer **URL com pooling** (ex. `?pgbouncer=true` ou host “pooler”), usa-a para o **Next na Vercel**; o backend pode usar a mesma ou a URL “direct” conforme o doc do fornecedor.

4. **Migrações** (quando a API já tiver código e `DATABASE_URL` apontar para esta base):  
   Na máquina onde tens o repo (ou num job de CI), na pasta `backend`:

   ```bash
   cd backend
   npx prisma migrate deploy
   ```

**Quando considerar a Parte 2 feita:** tens um `DATABASE_URL` de produção que testaste (por exemplo com `psql` ou com o `migrate deploy` sem erro).

---

## Parte 3 — API Nest (backend) em produção

**O que és:** o processo Node a correr com `NODE_ENV=production`, a escutar HTTPS **atrás de um proxy** (recomendado) ou exposto com TLS.

### 3.1 Variáveis mínimas da API

No **servidor** ou no painel do PaaS (Railway, Render, Fly, etc.), define pelo menos:

| Variável | Exemplo / notas |
|----------|------------------|
| `DATABASE_URL` | A string da Parte 2 |
| `JWT_SECRET` | Gera uma string **longa e aleatória** (≥ 32 caracteres). **O mesmo valor** vai para a Vercel no Next. |
| `FRONTEND_URL` | `https://www.pronuxfin.com.br` (exatamente a URL pública do site — CORS e links de email). |
| `NODE_ENV` | `production` |
| `PORT` | O que o host espera (ex. `4000`) |

Opcional mas útil:

| Variável | Notas |
|----------|--------|
| `PLATFORM_ADMIN_EMAILS` | O teu email (ou vários separados por vírgula). Quem faz login com esse email fica admin no `/auth/me`. |
| `SMTP_URL`, `SMTP_FROM` | Para recuperação de senha por email em produção. |
| `TRUST_PROXY` | `1` se estiveres atrás de nginx/Cloudflare (IP real para rate limit). |

### 3.2 HTTPS e URL pública

- **Opção A — PaaS:** muitos dão HTTPS automático; anota a URL pública (ex. `https://api-pronuxfin.onrender.com`).  
- **Opção B — VPS:** nginx/Caddy na frente do Nest, certificado Let’s Encrypt, domínio tipo `https://api.pronuxfin.com.br`.

**Quando considerar a Parte 3 feita:** no browser ou com `curl`, `GET https://<tua-api>/health/live` responde **200** JSON com `ok: true`; `GET https://<tua-api>/health/ready` responde **200** com base de dados OK.

---

## Parte 4 — Projeto Next na Vercel

**O que és:** ligar o GitHub à Vercel e configurar o monorepo corretamente.

1. **Vercel → Add New Project** → importa o repositório **PRONUXFIN**.  
2. **Root Directory:** escolhe **`web`** (obrigatório neste repo).  
3. **Framework:** Next.js (detetado automaticamente na maior parte dos casos).  
4. **Deploy** (primeira vez pode ser só com variáveis mínimas; podes refazer deploy depois de alterar envs).

### 4.1 Variáveis na Vercel (Settings → Environment Variables → Production)

Gere o kit na raiz do repo:

```bash
npm run production:setup
npm run production:verify -- .env.production.generated
```

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.pronuxfin.com.br` |
| `API_URL` | URL HTTPS da API Nest (ex.: `https://api.pronuxfin.com.br`) |
| `DATABASE_URL` | Postgres (Parte 2) |
| `JWT_ALGORITHM` | `RS256` |
| `JWT_PUBLIC_KEY` | PEM pública (gerada por `production:setup`) |
| `INTERNAL_API_SECRET` | ≥32 chars, **igual** ao backend |
| `COOKIE_SAMESITE_STRICT` | `1` |
| `CSRF_ENFORCE` | `1` |
| `AUTH_SESSION_VERSION_CHECK` | `1` |
| `AI_KEYS_ENCRYPTION_KEY` | 64 hex |
| `WEBAUTHN_RP_ID` | `www.pronuxfin.com.br` |
| `WEBAUTHN_ORIGIN` | `https://www.pronuxfin.com.br` |
| `OPENAI_API_KEY` ou `GEMINI_API_KEY` | Obrigatório (sem IA = manutenção) |
| `BRAPI_TOKEN`, `FMP_API_KEY` | Mercado ao vivo (recomendado) |

Checklist completo: `docs/PRONUXFIN_OPERATOR_CHECKLIST.md`.

5. **Redeploy** depois de guardar as variáveis (**Deployments → … → Redeploy**).

**Quando considerar a Parte 4 feita:** abres a URL `.vercel.app` do projeto, a home carrega, e (com API no ar) registo/login funcionam.

---

## Parte 5 — Alinhar front e API (CORS)

**O que és:** o Nest só aceita pedidos do origin definido em `FRONTEND_URL`.

1. Garante `FRONTEND_URL=https://www.pronuxfin.com.br` (ou a URL exata que usas na Vercel, **com** `https://`).  
2. Se mudares o domínio do site, **atualiza** `FRONTEND_URL` e faz **redeploy da API**.  
3. Testa login: se o browser mostrar erro de CORS, quase sempre é `FRONTEND_URL` errado ou em falta.

**Quando considerar a Parte 5 feita:** login a partir do site na Vercel funciona sem erro de CORS na consola.

---

## Parte 6 — Domínio `www.pronuxfin.com.br` na Vercel + DNS

**O que és:** o mundo a usar o teu domínio em vez de `*.vercel.app`.

### 6.1 Na Vercel

1. Projeto → **Settings → Domains**.  
2. Adiciona **`www.pronuxfin.com.br`**.  
3. A Vercel mostra o que tens de criar no DNS (normalmente **CNAME** `www` → `cname.vercel-dns.com` ou instruções específicas).

### 6.2 No registador do domínio

1. Painel DNS do `pronuxfin.com.br`.  
2. Cria o registo que a Vercel pediu (CNAME ou A).  
3. **Propagação:** pode demorar de minutos a horas.

### 6.3 Apex (opcional)

Se quiseres `pronuxfin.com.br` **sem** `www` a abrir o site: na Vercel podes adicionar o apex e configurar **redirect** para `www` (recomendado para um único canonical).

### 6.4 Variável do site

Quando `www` estiver a funcionar, confirma `NEXT_PUBLIC_SITE_URL=https://www.pronuxfin.com.br` e faz redeploy.

**Quando considerar a Parte 6 feita:** `https://www.pronuxfin.com.br` abre o site com certificado válido.

---

## Parte 7 — API num subdomínio (exemplo)

**O que és:** `https://api.pronuxfin.com.br` a apontar para o mesmo backend que já tens.

1. No DNS do domínio, cria **CNAME** `api` → o hostname que o teu hosting da API indicar **ou** A para o IP da VPS.  
2. No proxy (nginx/Caddy) ou no PaaS, certificado TLS para `api.pronuxfin.com.br`.  
3. Na Vercel, `API_URL=https://api.pronuxfin.com.br`.  
4. Redeploy do Next.

**Quando considerar a Parte 7 feita:** `API_URL` no browser (Network) nos pedidos `/api/auth/*` aponta para esse host e responde 200.

---

## Parte 8 — Verificação final (smoke test)

Faz na ordem:

1. `https://www.pronuxfin.com.br` — home carrega.  
2. `https://www.pronuxfin.com.br/api/health` — **200**.  
3. `https://www.pronuxfin.com.br/api/health/ready` — **200** com `ok: true` (se falhar, a tabela `checks` indica o que falta: API, DB, envs).  
4. `https://<tua-api>/health/ready` — **200**.  
5. Registo → login → painel → guardar um símbolo na watchlist.  
6. Se configuraste SMTP: “Esqueci a senha” e receber o email.

---

## Parte 9 — P10 enterprise (segurança avançada)

**O que és:** activar WebAuthn/passkeys, audit log, refresh rotativo e alertas de login **depois** de API + Vercel estarem no ar.

### 9.1 Migrações (obrigatório)

Na máquina com `DATABASE_URL` de produção (ou CI/Vercel build):

```bash
npm run migrate:deploy
```

Isto corre `prisma migrate deploy` no **backend** (tabelas `RefreshToken`, `SecurityEvent`, `WebAuthn*`) e no **web** (`AuthRateLimit`).

### 9.2 Backend — variáveis adicionais

| Variável | Valor |
|----------|--------|
| `INTERNAL_API_SECRET` | String longa (≥ 32 chars) — **igual** no web |
| `JWT_ALGORITHM` | `RS256` |
| `JWT_PRIVATE_KEY` | PEM (só no backend) |
| `REFRESH_STRICT_BIND` | `1` |
| `AUTH_LOGIN_NOTIFY` | `1` (omitir ou `=0` para desligar) |
| `SMTP_URL`, `SMTP_FROM` | Para reset de senha **e** alertas de login |
| `WEBAUTHN_RP_ID` | `www.pronuxfin.com.br` (hostname público) |
| `WEBAUTHN_ORIGIN` | `https://www.pronuxfin.com.br` (sem `/` final) |
| `WEBAUTHN_RP_NAME` | `PRONUXFIN` |

### 9.3 Vercel (web) — variáveis adicionais

| Variável | Valor |
|----------|--------|
| `INTERNAL_API_SECRET` | **Igual** ao backend |
| `JWT_ALGORITHM` | `RS256` |
| `JWT_PUBLIC_KEY` | PEM (só chave pública) |

Opcional: `AUTH_SESSION_VERSION_CHECK=1` (padrão), `CSRF_ENFORCE=1` (padrão em prod).

### 9.4 Smoke P10 (manual)

1. **Perfil → Adicionar passkey** (biometria/PIN).  
2. Logout → login com password → confirmar passkey.  
3. **Perfil → Registo de segurança** — eventos `LOGIN_SUCCESS`, `WEBAUTHN_*`.  
4. Login noutro browser/dispositivo → email de novo acesso (se SMTP activo).  
5. **Perfil → Sessões** → revogar outro dispositivo.

### 9.5 Readiness (operador)

Com `HEALTH_PROBE_SECRET` definido:

```bash
curl -H "Authorization: Bearer $HEALTH_PROBE_SECRET" \\
  https://www.pronuxfin.com.br/api/health/ready
```

Resposta inclui `checks` + `enterprise_hints` (avisos RS256, strict bind, SMTP, WebAuthn).

---

## Ordem sugerida (resumo numa frase)

**Postgres → API com envs + HTTPS → Vercel (web) com envs → CORS → DNS www → (opcional) api. → `npm run migrate:deploy` → envs P10 → smoke tests.**

Se quiseres, no próximo mensagem diz em **que parte estás** (ex.: “já tenho Postgres”) e afinamos só essa parte (valores concretos, erros que aparecem, etc.).
