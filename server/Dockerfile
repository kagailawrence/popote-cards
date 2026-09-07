# Stage 1: Build TypeScript backend
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Corepack and PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code and config
COPY tsconfig.json ./
COPY src/ ./src/
COPY db/ ./db/

# Build TypeScript
RUN pnpm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install runtime utilities (curl/wget for healthcheck, libc6-compat for sharp)
RUN apk add --no-cache libc6-compat curl wget

# Enable Corepack and PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency definitions and install production-only dependencies
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Copy compiled JavaScript and DB migrations/seeds
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db
COPY --from=builder /app/src/db ./src/db

# Ensure storage directories exist
RUN mkdir -p /app/storage/tmp \
             /app/storage/customer-photos \
             /app/storage/design-images \
             /app/storage/print-ready

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]
