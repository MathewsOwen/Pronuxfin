# Deploy PRONUXFIN (frontend Next.js)

> Para a visão completa de GitHub + banco + backend + smoke test de produção, consulte `docs/github-production-checklist.md` na raiz. **Lista curta só das tuas ações (chaves, Vercel, FMP, IA):** `docs/PRONUXFIN_OPERATOR_CHECKLIST.md`.

## Por que não abria no PC?

1. **Suba o servidor** na pasta `web`:

   ```bash
   cd web
   npm install
   npm run dev
   ```

2. Abra no navegador: **http://127.0.0.1:3000** (no Windows, às vezes `localhost` falha por IPv6 — use `127.0.0.1`).

3. Se usar **OneDrive** na pasta do projeto, pode haver travamentos ou sync lento; prefira clonar em `C:\dev\PronuxFin` sem sync pesado.

## Deploy na Vercel (recomendado)

1. Suba o código para um repositório **GitHub**.
2. Em [vercel.com](https://vercel.com), **Add New Project** → importe o repo.
3. Configure **Root Directory** = `web` (obrigatório: o Next vive em `web/` e as rotas públicas estão em `src/app/[locale]/`; sem isto verá 404 na home).
4. Variáveis de ambiente (Production) — gere o kit completo na raiz do repo:

   ```bash
   npm run production:setup
   npm run production:verify -- .env.production.generated
   ```

   Cole na Vercel **todas** as variáveis do bloco WEB em `.env.production.generated`. Resumo:

   | Nome | Valor |
   |------|--------|
   | `NEXT_PUBLIC_SITE_URL` | `https://www.pronuxfin.com.br` |
   | `API_URL` | URL HTTPS do NestJS |
   | `DATABASE_URL` | PostgreSQL |
   | `JWT_ALGORITHM` | `RS256` |
   | `JWT_PUBLIC_KEY` | PEM pública |
   | `INTERNAL_API_SECRET` | ≥32 chars (igual backend) |
   | `COOKIE_SAMESITE_STRICT` | `1` |
   | `AI_KEYS_ENCRYPTION_KEY` | 64 hex |
   | `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN` | domínio produção |
   | `OPENAI_API_KEY` ou `GEMINI_API_KEY` | motor IA obrigatório |
   | `BRAPI_TOKEN`, `FMP_API_KEY` | mercado ao vivo |

   Lista completa: `docs/PRONUXFIN_OPERATOR_CHECKLIST.md`.

   Admin no painel: define-se no **backend** (`PLATFORM_ADMIN_EMAILS` em `backend/.env` ou env do host), não na Vercel.

5. Se o front usar recursos autenticados com Prisma no ambiente Next, configure também:

   - `DATABASE_URL`
   - `AI_KEYS_ENCRYPTION_KEY`

6. Deploy. A URL tipo `https://<projeto>.vercel.app` é o link público até você apontar o domínio comprado.

## CI com GitHub Actions

1. Crie um projeto na Vercel e copie **Org ID** e **Project ID** (Settings → General).
2. Gere um **Token** em Vercel → Account Settings → Tokens.
3. No GitHub do repo:
   - **Settings → Secrets and variables → Actions → Variables**: crie `ENABLE_VERCEL_CLI_DEPLOY` = `true` (sem isto o job de deploy **não corre** — o workflow está desligado por defeito).
   - **Secrets**: adicione `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (IDs em Vercel → projeto → Settings → General; token em Account Settings → Tokens).
4. Com a variável e os secrets definidos, cada push relevante na branch `main` dispara `.github/workflows/deploy-web-vercel.yml`.

## Antes de abrir para utilizadores reais

1. Copiar variáveis de `web/.env.example` para a Vercel (e `.env.local` em dev)
2. Validar `API_URL` apontando para a API pública correta
3. Confirmar que `JWT_SECRET` e configurações de auth estão coerentes entre front e backend
4. Confirmar que o banco real já recebeu as migrações
5. Executar o smoke test: `docs/smoke-test.md` (`npm run smoke` na raiz ou `./scripts/smoke.sh`)

## APIs “mais rápidas” neste projeto

- Rotas `/api/quotes` e `/api/news` estão em modo **`force-dynamic`** com **`cache: no-store`** nas fontes → cada pedido busca dados atualizados (sem cache ISR na CDN para essas respostas).
- **Região `gru1`** na Vercel aproxima o serverless do público brasileiro.
- Limitação real: latência e rate limits de **brapi**, **CoinGecko** e feeds **RSS** — não há como ultrapassar isso sem APIs pagas ou infra própria.
