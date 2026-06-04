#!/bin/sh
# Production container entrypoint (Dokploy / Nixpacks).
# Migrations run here (not at build) so the builder has no DB network access.
set -e

log() {
  echo "[moonskin-start] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"
}

PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"

log "Applying Prisma migrations..."
npx prisma migrate deploy

log "Starting Next.js on ${HOSTNAME}:${PORT}..."
exec pnpm exec next start -H "$HOSTNAME" -p "$PORT"
