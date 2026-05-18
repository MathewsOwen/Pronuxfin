# GitHub + Producao

Checklist operacional para deixar a PRONUXFIN pronta para deploy publico com GitHub, Vercel, backend containerizado e banco PostgreSQL.

Para um guia numerado por fases (dominio, Vercel, API, DNS), ver [`deploy-passo-a-passo.md`](./deploy-passo-a-passo.md).

## 1. Repositorio GitHub

- Confirmar a branch principal como `main`
- Ativar branch protection em `main`
- Exigir pull request para mudancas criticas quando o fluxo amadurecer
- Exigir status checks do workflow `CI`
- Revisar visibilidade de Actions e Packages no repositório

## 2. GitHub Actions

Workflows atuais:

- `ci.yml`: lint, typecheck, testes, build e smoke Docker
- `codeql.yml`: analise estatica
- `security-audit.yml`: auditoria adicional
- `deploy-web-vercel.yml`: deploy do front-end na Vercel
- `publish-backend-image.yml`: build e push da API para GHCR

## 3. Segredos do GitHub

### Para deploy do front-end na Vercel

Adicionar em `Settings > Secrets and variables > Actions`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Para servicos futuros ou automacoes extras

So adicionar quando realmente for usar:

- tokens de cloud
- credenciais de monitoramento
- segredos de notificacao

Nunca commitar:

- `.env`
- chaves SMTP
- DSNs privados
- tokens de API pagos

## 4. Front-end na Vercel

No import do projeto:

- Repository: este repo
- Root Directory: `web`
- Framework: Next.js

Variaveis recomendadas:

- `API_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL` se o front usar Prisma para recursos autenticados
- `AI_KEYS_ENCRYPTION_KEY`
- `ENABLE_CSP_REPORT_ONLY`
- `BRAPI_TOKEN`
- `FMP_API_KEY`

Opcional:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

### Sentry: degradação de plataforma (banner privado)

O `AppShell` envia mensagens quando o estado **degradado** muda (Sentry ativo com DSN).

- Mensagens: `platform_status_degraded`, `platform_status_recovered`
- Tags: `platform.status` (`degraded` | `recovered`), `platform.degraded_bucket` (ex.: `backend_not_ready_or_warming`)
- Fingerprint custom: agrupa por `pronux-platform-status` + causa aproximada (evita explosão de issues)

**Discover (exemplos de query):**

- `message:platform_status_degraded`
- `message:platform_status_recovered`
- `platform.degraded_bucket:backend_connectivity`

**Issues:** filtre por título contendo `platform_status_degraded` ou pela tag `platform.status:degraded`.

Buckets usados em `platform.degraded_bucket`: `frontend_api_url_missing`, `backend_not_ready_or_warming`, `backend_connectivity`, `other`, `unknown`.

## 5. Backend em producao

Opcao recomendada:

- Build da imagem pelo workflow `publish-backend-image.yml`
- Pull da imagem `ghcr.io/<owner>/<repo>:latest`
- Execucao com `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

Variaveis obrigatorias da API:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `NODE_ENV=production`

Variaveis importantes para auth e e-mail:

- `SMTP_URL`
- `SMTP_FROM`
- `AUTH_RESET_TOKEN_TTL_MIN`

Lista de e-mails de administrador da plataforma (separados por virgula ou ponto e virgula; comparacao case-insensitive). Quem fizer login com um destes e-mails recebe `isAdmin: true` em `/auth/me` e distintivo Admin no painel:

- `PLATFORM_ADMIN_EMAILS` (ex.: `voce@empresa.com`)

## 6. Banco de dados

Antes do deploy publico:

1. Provisionar PostgreSQL real
2. Aplicar migracoes do backend
3. Validar conexao da API
4. Validar se o front aponta para a mesma base esperada para auth e watchlist

## 7. Dominio e DNS

- Apontar dominio principal para a Vercel (ex.: `www.pronuxfin.com.br` e apex `pronuxfin.com.br` com redirect para `www` se desejar)
- Configurar subdominio da API se ela ficar separada (ex.: `api.pronuxfin.com.br`)
- Garantir HTTPS em ambos
- Atualizar `NEXT_PUBLIC_SITE_URL` e `FRONTEND_URL`

## 8. Smoke test de producao

Depois do primeiro deploy:

1. Abrir home publica
2. Validar mercado, noticias e projecao
3. Criar conta
4. Fazer login
5. Abrir dashboard
6. Salvar ativo na watchlist
7. Abrir comparador
8. Abrir central de alertas
9. Validar fluxo de reset de senha
10. Abrir IA de mercado com deep link

Checks tecnicos adicionais (readiness):

11. Frontend: `GET /api/health` deve responder `200` com `status: "ok"` (liveness)
12. Frontend: `GET /api/health/ready` deve responder `200` com `ok: true`
13. Backend: `GET /health/live` e `GET /health/ready` devem responder `200`
14. Se `GET /api/health/ready` retornar `503`, corrigir os campos em `checks` antes de abrir ao publico

## 9. Endurecimento recomendado

- Ativar branch protection
- Revisar permissoes dos workflows
- Adicionar ambiente `production` no GitHub com aprovacao manual se quiser mais controle
- Configurar monitoramento de erros
- Configurar backups do banco
- Documentar responsavel por deploy e rollback
- Modo manutencao automatico no front (layout privado) com gate de readiness:
  - ativo por padrao em `NODE_ENV=production`
  - bypass manual com `MAINTENANCE_FORCE_OFF=1`
  - forcar bloqueio com `MAINTENANCE_FORCE_ON=1`

## 11. Go-live minimo (o que falta para usuarios reais)

Ordem sugerida:

1. **Postgres** gerido + backups; `DATABASE_URL` com **pooling** (ex. `?pgbouncer=true` / Neon pooler) onde aplicavel.
2. **Backend** no ar com `JWT_SECRET` (>=32 chars), `FRONTEND_URL` = URL publica do Next, `NODE_ENV=production`; `npx prisma migrate deploy` aplicado.
3. **SMTP** real (`SMTP_URL`, `SMTP_FROM`) se quiseres recuperacao de senha por e-mail (sem isto, reset pode falhar ou ficar so em dev log).
4. **Vercel** (ou host do Next): Root Directory `web`; `API_URL` apontando para a API publica; `JWT_SECRET` **igual** ao do backend; `NEXT_PUBLIC_SITE_URL` = URL publica do site.
5. **Prisma no Next** (watchlist, BYOK, readiness): `DATABASE_URL` + `AI_KEYS_ENCRYPTION_KEY` (hex 64) se usares essas funcoes.
6. **Mercado**: `BRAPI_TOKEN` (recomendado para B3); `FMP_API_KEY` ou `FINANCIAL_MODELING_PREP_API_KEY` para dossies internacionais mais ricos; sem tokens o app usa fallbacks/simulacao onde o codigo preve.
7. **Admin**: `PLATFORM_ADMIN_EMAILS` no backend com o teu e-mail.
8. **CORS**: `FRONTEND_URL` na API deve coincidir com o dominio real do front (inclui `https://`).
9. **Probes**: `GET /api/health/ready` (Vercel) e `GET /health/ready` (API) com `200` antes de divulgar o link.
10. **Middleware**: rotas privadas (`/dashboard`, `/compare`, `/alerts`, `/ativo`, `/assistant`, `/education`) exigem JWT valido no edge — confirmar apos deploy.

Opcional mas recomendado: `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`, branch protection no GitHub, Dependabot a rever PRs.

## 12. O que **não** está no Git — tens de fornecer tu (ou a equipa / DNS / painéis)

Isto não pode ser automatizado só com commits: precisa de contas, domínio e segredos reais.

| O que | Onde / notas |
|-------|----------------|
| **Domínio** `pronuxfin.com.br` | Registador (Registro.br, Cloudflare, etc.): DNS apontado conforme Vercel (CNAME/A para o projeto Next). |
| **Subdomínio `www`** | Na Vercel: domínio `www.pronuxfin.com.br` (e opcional redirect apex → www). |
| **API pública HTTPS** | VPS + nginx/Caddy, Railway, Render, fly.io, etc. URL final (ex. `https://api.pronuxfin.com.br`) para `API_URL` no Next. |
| **Certificados TLS** | Vercel gere o do site; na API o proxy ou o PaaS gere ACME. |
| **PostgreSQL gerido** | Connection string com utilizador/senha; backups ativados no fornecedor. |
| **Valores secretos** | `JWT_SECRET` (gerar string longa), `DATABASE_URL`, `POSTGRES_*` se usares Compose, `AI_KEYS_ENCRYPTION_KEY` (64 hex) se usares BYOK. |
| **`FRONTEND_URL` na API** | Deve ser exatamente a URL pública do Next (ex. `https://www.pronuxfin.com.br`) para CORS e links de reset. |
| **`PLATFORM_ADMIN_EMAILS`** | Lista de e-mails admin no **backend** (Compose: `.env` na raiz; outros hosts: env do processo). |
| **SMTP** (`SMTP_URL`, `SMTP_FROM`) | Provedor de e-mail (SendGrid, SES, etc.) para recuperação de senha em produção. |
| **Tokens de dados** | `BRAPI_TOKEN`, `FMP_API_KEY` / `FINANCIAL_MODELING_PREP_API_KEY` no **web** (Vercel) para mercado mais estável. |
| **GitHub Secrets (opcional deploy CLI)** | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` + variable `ENABLE_VERCEL_CLI_DEPLOY=true` se quiseres deploy por Action em vez de só integração Git na Vercel. |
| **Smoke test manual** | Após DNS propagar: login, painel, watchlist, `/api/health/ready` = 200. |

Modelos de `.env` comentados: `web/.env.example`, `backend/.env.example`, `docker-compose.env.example`.
