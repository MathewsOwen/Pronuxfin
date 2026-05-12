# API NestJS — staging / produção (multi-stage).
# Build: docker build -t pronuxfin-api:latest ./backend
# compose: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d api

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nest -u 1001 -G nodejs
COPY --from=builder --chown=nest:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nest:nodejs /app/dist ./dist
COPY --from=builder --chown=nest:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nest:nodejs /app/prisma ./prisma
COPY --chown=nest:nodejs scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER nest
EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
