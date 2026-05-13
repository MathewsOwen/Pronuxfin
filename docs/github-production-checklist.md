# GitHub + Producao

Checklist operacional para deixar a PRONUXFIN pronta para deploy publico com GitHub, Vercel, backend containerizado e banco PostgreSQL.

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

## 6. Banco de dados

Antes do deploy publico:

1. Provisionar PostgreSQL real
2. Aplicar migracoes do backend
3. Validar conexao da API
4. Validar se o front aponta para a mesma base esperada para auth e watchlist

## 7. Dominio e DNS

- Apontar dominio principal para a Vercel
- Configurar subdominio da API se ela ficar separada
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

## 9. Endurecimento recomendado

- Ativar branch protection
- Revisar permissoes dos workflows
- Adicionar ambiente `production` no GitHub com aprovacao manual se quiser mais controle
- Configurar monitoramento de erros
- Configurar backups do banco
- Documentar responsavel por deploy e rollback

## 10. Ordem ideal de rollout

1. Banco
2. Backend
3. Front-end
4. Dominio
5. Smoke test final
