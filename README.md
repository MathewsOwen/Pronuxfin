# PRONUXFIN

[![CI](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/ci.yml/badge.svg)](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/ci.yml)
[![CodeQL](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/codeql.yml/badge.svg)](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/codeql.yml)
[![Deploy Web](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/deploy-web-vercel.yml/badge.svg)](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/deploy-web-vercel.yml)

PRONUXFIN é uma plataforma de inteligência de mercado com front-end em Next.js, backend em NestJS e uma arquitetura pensada para evoluir de um desk financeiro moderno para uma experiência mais profunda de terminal, watchlist inteligente, briefing acionável e produtos educacionais.

## Arquitetura

- `web/`: app Next.js com interface pública, autenticação, terminal privado, watchlist, comparador e IA de mercado
- `backend/`: API NestJS com auth JWT, Prisma e serviços de suporte
- `docs/`: prompts, notas operacionais e material de apoio
- `docker-compose*.yml`: infraestrutura local e base para operação self-hosted

## Stack principal

- Next.js + React + TypeScript
- Tailwind CSS
- NestJS
- Prisma
- PostgreSQL
- GitHub Actions
- Vercel para o front-end
- GHCR / Docker para a API

## Scripts da raiz

- `npm run dev`: sobe `backend` e `web` juntos
- `npm run dev:web`: sobe apenas o front-end
- `npm run dev:api`: sobe apenas o backend
- `npm run db:up`: sobe a infraestrutura local
- `npm run db:down`: derruba a infraestrutura local
- `npm run build`: build completo do projeto
- `npm run prisma:migrate`: aplica migrações do backend
- `npm run validate`: templates `.env`, testes web + typecheck + testes backend
- `npm run test`: testes do web (Vitest) + backend (Jest/e2e)
- `npm run smoke`: checks HTTP rápidos (ver `docs/smoke-test.md`)
- `npm run smoke:strict`: smoke em modo produção (503 = falha)
- `npm run release:check`: validação do repo + checklist go-live (Fase 5)

## Setup local

1. Instale dependências na raiz, em `web/` e em `backend/`.
2. Configure os arquivos `.env` necessários a partir dos exemplos.
3. Se for usar banco local, suba a infraestrutura com `npm run db:up`.
4. Rode `npm run dev` na raiz.
5. Acesse o front-end em `http://127.0.0.1:3000`.

## Estratégia de deploy

- `web`: deploy na Vercel com **Root Directory = `web`** (obrigatório neste monorepo). Se o projeto estiver na raiz do repositório, o build até pode passar, mas a home e rotas públicas podem responder 404 (middleware `next-intl` reescreve para `/pt-BR` / `/en`, que existem apenas dentro de `src/app/[locale]/`).
- `backend`: build containerizado e publicação no GHCR
- `database`: PostgreSQL dedicado, preferencialmente gerenciado
- `CI`: lint, typecheck, testes, build e smoke de imagem Docker via GitHub Actions

## GitHub e produção

- Guia do front-end: `web/DEPLOY.md`
- Checklist completo de GitHub + produção: `docs/github-production-checklist.md` (inclui **Seção 12**: o que tens de fornecer fora do Git — DNS, segredos, SMTP, API pública).
- **Smoke test** (local e produção): `docs/smoke-test.md` — variáveis em `web/.env.example` e `backend/.env.example`.
- **Fase 1 — produção confiável:** `docs/phase-1-production.md` (SMTP, CORS, readiness, go-live).
- **Critérios 10/10 (Fases 0+1):** `docs/phases-0-1.md`
- **Fase 2 — dados reais (BRAPI/FMP):** `docs/phase-2-market-data.md`
- **Fase 3 — UX (onboarding, menu, empty states):** `docs/phase-3-ux.md`
- **Critérios 10/10 (Fases 2+3):** `docs/phases-2-3.md`
- **Fase 4 — polish (SEO, a11y, performance):** `docs/phase-4-polish.md`
- **Fase 5 — go-live & confiança:** `docs/phase-5-go-live.md`
- **Critérios 10/10 (Fases 4+5):** `docs/phases-4-5.md`
- **Carteira simulada (do zero):** conta nova sem posições; `/carteira` com busca ao vivo (BRAPI/Yahoo) para adicionar ativos com cotação em tempo real
- **Arquitetura:** `ARCHITECTURE.md` · **Segurança:** `SECURITY.md`

## Estado atual

- Repositório monorepo publicado e estruturado
- Workflows de CI, auditoria, CodeQL e deploy configurados
- Segredos e artefatos de build ignorados no Git

## Observações

- O backend depende de PostgreSQL acessível e configurado corretamente
- Recursos privados exigem `API_URL`, `DATABASE_URL`, `JWT_SECRET` e demais segredos coerentes entre os serviços
- Antes do deploy final, é importante aplicar migrações no banco real e executar um smoke test completo de login, dashboard, watchlist, alertas e IA
