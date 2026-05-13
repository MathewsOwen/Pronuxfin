# PRONUXFIN

[![CI](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/ci.yml/badge.svg)](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/ci.yml)
[![CodeQL](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/codeql.yml/badge.svg)](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/codeql.yml)
[![Deploy Web](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/deploy-web-vercel.yml/badge.svg)](https://github.com/MathewsOwen/Pronuxfin/actions/workflows/deploy-web-vercel.yml)

PRONUXFIN e uma plataforma de inteligencia de mercado com front-end em Next.js, backend em NestJS e uma arquitetura pensada para evoluir de um desk financeiro moderno para uma experiencia mais profunda de terminal, watchlist inteligente, briefing acionavel e produtos educacionais.

## Arquitetura

- `web/`: app Next.js com interface publica, autenticacao, terminal privado, watchlist, comparador e IA de mercado
- `backend/`: API NestJS com auth JWT, Prisma e servicos de suporte
- `docs/`: prompts, notas operacionais e material de apoio
- `docker-compose*.yml`: infraestrutura local e base para operacao self-hosted

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
- `npm run prisma:migrate`: aplica migracoes do backend

## Setup local

1. Instale dependencias na raiz, em `web/` e em `backend/`.
2. Configure os arquivos `.env` necessarios a partir dos exemplos.
3. Se for usar banco local, suba a infraestrutura com `npm run db:up`.
4. Rode `npm run dev` na raiz.
5. Acesse o front-end em `http://127.0.0.1:3000`.

## Estrategia de deploy

- `web`: deploy na Vercel com **Root Directory = `web`** (obrigatório neste monorepo). Se o projeto estiver na raiz do repositório, o build até pode passar, mas a home e rotas públicas podem responder 404 (middleware `next-intl` reescreve para `/pt-BR` / `/en`, que existem apenas dentro de `src/app/[locale]/`).
- `backend`: build containerizado e publicacao no GHCR
- `database`: PostgreSQL dedicado, preferencialmente gerenciado
- `CI`: lint, typecheck, testes, build e smoke de imagem Docker via GitHub Actions

## GitHub e producao

- Guia do front-end: `web/DEPLOY.md`
- Checklist completo de GitHub + producao: `docs/github-production-checklist.md`

## Estado atual

- Repositorio monorepo publicado e estruturado
- Workflows de CI, auditoria, CodeQL e deploy configurados
- Segredos e artefatos de build ignorados no Git

## Observacoes

- O backend depende de PostgreSQL acessivel e configurado corretamente
- Recursos privados exigem `API_URL`, `DATABASE_URL`, `JWT_SECRET` e demais segredos coerentes entre os servicos
- Antes do deploy final, e importante aplicar migracoes no banco real e executar um smoke test completo de login, dashboard, watchlist, alertas e IA
