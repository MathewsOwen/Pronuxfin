#!/usr/bin/env bash
set -euo pipefail
# Render (e outros hosts) costumam definir NODE_ENV=production; isso faz o npm ci
# pular devDependencies — e o @nestjs/cli some ("nest: not found").
NPM_CONFIG_PRODUCTION=false npm ci
npx prisma generate
npm run build