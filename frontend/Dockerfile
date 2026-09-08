# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Configure PNPM network resilience
RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set network-concurrency 4

COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install dependencies with BuildKit cache
RUN --mount=type=cache,id=pnpm-store-frontend,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG INTERNAL_BACKEND_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api/v1}
ENV INTERNAL_BACKEND_URL=${INTERNAL_BACKEND_URL:-http://server:4000}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# Stage 3: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
