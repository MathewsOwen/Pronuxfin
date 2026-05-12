#!/bin/sh
set -eu

if [ "${SKIP_PRISMA_MIGRATE:-0}" != "1" ]; then
  echo "[entrypoint] prisma migrate deploy…"
  npx prisma migrate deploy
fi

exec node dist/main.js
