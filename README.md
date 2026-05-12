# PRONUXFIN

Monorepo da plataforma PRONUXFIN, com front-end em Next.js e backend em NestJS.

## Estrutura

- `web/`: aplicacao web com Next.js
- `backend/`: API e autenticacao com NestJS + Prisma
- `docker-compose.yml`: infraestrutura local para banco de dados

## Stack

- Next.js
- React
- Tailwind CSS
- NestJS
- Prisma
- PostgreSQL

## Scripts da raiz

- `npm run dev`: sobe `backend` e `web` juntos
- `npm run dev:web`: sobe apenas o front-end
- `npm run dev:api`: sobe apenas o backend
- `npm run db:up`: sobe a infraestrutura local
- `npm run db:down`: derruba a infraestrutura local
- `npm run build`: build completo do projeto

## Como rodar localmente

1. Instale as dependencias na raiz, em `web/` e em `backend/`.
2. Configure os arquivos de ambiente necessarios.
3. Suba o banco local com `npm run db:up` se for usar a estrutura Docker.
4. Rode `npm run dev` na raiz.

## Observacoes

- O front-end roda em `http://127.0.0.1:3000`.
- O backend depende de banco PostgreSQL configurado corretamente.
- Arquivos sensiveis e artefatos de build estao ignorados no Git.
