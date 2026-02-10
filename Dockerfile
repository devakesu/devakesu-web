# syntax=docker/dockerfile:1

# ===============================
# 0. Global deterministic settings
# ===============================
ARG NODE_IMAGE=node:20.19.0-alpine3.20
ARG SOURCE_DATE_EPOCH=1767225600

# ===============================
# 1. Dependencies layer
# ===============================
FROM ${NODE_IMAGE} AS deps

ARG SOURCE_DATE_EPOCH
ENV SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}
ENV TZ=UTC

# Install only required native dependencies
RUN apk add --no-cache \
    libc6-compat \
    && rm -rf /var/cache/apk/*

WORKDIR /app

ARG APP_COMMIT_SHA
ENV APP_COMMIT_SHA=${APP_COMMIT_SHA}

COPY package.json package-lock.json ./

# Use npm ci for clean install
RUN npm ci \
    --no-audit \
    --no-fund \
    --prefer-offline \
    --ignore-scripts

# ===============================
# 2. Build layer
# ===============================
FROM ${NODE_IMAGE} AS builder

ARG SOURCE_DATE_EPOCH
ARG APP_COMMIT_SHA
ARG BUILD_ID
ARG AUDIT_STATUS
ARG SIGNATURE_STATUS
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ANALYTICS_ENABLED

ENV SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}
ENV APP_COMMIT_SHA=${APP_COMMIT_SHA}
ENV BUILD_ID=${BUILD_ID}
ENV GITHUB_SHA=${APP_COMMIT_SHA}
ENV GITHUB_RUN_NUMBER=${BUILD_ID}
ENV AUDIT_STATUS=${AUDIT_STATUS}
ENV SIGNATURE_STATUS=${SIGNATURE_STATUS}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_ANALYTICS_ENABLED=${NEXT_PUBLIC_ANALYTICS_ENABLED}
ENV TZ=UTC
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --link . .

# Validate required build args
RUN set -e; \
    : "${APP_COMMIT_SHA:?APP_COMMIT_SHA is required}"; \
    : "${BUILD_ID:?BUILD_ID is required}";

# Build with minimal resources and clean cache
RUN npm run build && \
    rm -rf .next/cache

# Normalize timestamps for reproducible builds
RUN find .next -exec touch -d "@${SOURCE_DATE_EPOCH}" {} +

# Normalize absolute paths in standalone server
RUN sed -i 's|/app/|/|g' .next/standalone/server.js

# ===============================
# 3. Runtime layer
# ===============================
FROM ${NODE_IMAGE} AS runner

ARG SOURCE_DATE_EPOCH
ARG APP_COMMIT_SHA
ENV SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}
ENV APP_COMMIT_SHA=${APP_COMMIT_SHA}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Note: GA_API_SECRET and GA_MEASUREMENT_ID are required at runtime for analytics.
# Do NOT bake secrets or environment-specific configuration into the image at build time.
# Instead, provide GA_API_SECRET and GA_MEASUREMENT_ID as runtime environment variables via:
#   - docker run -e GA_API_SECRET=your_secret_here -e GA_MEASUREMENT_ID=your_measurement_id_here
#   - Orchestration platform secrets/config management (Kubernetes, Docker Swarm, etc.)
#   - Cloud provider environment variable configuration (AWS ECS, Azure Container Apps, etc.)
# While GA_MEASUREMENT_ID is less sensitive than GA_API_SECRET, providing both at runtime
# offers flexibility to change configuration without rebuilding the image.

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache wget

# Core Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Clean up
RUN rm -rf \
    /usr/share/man/* \
    /usr/share/doc/* \
    /var/cache/apk/* \
    /tmp/* \
    /root/.npm \
    /root/.cache

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
