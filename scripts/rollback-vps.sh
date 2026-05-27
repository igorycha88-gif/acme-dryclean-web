#!/bin/bash
set -euo pipefail

APP_DIR="/opt/app"
CONTENT_PORT=8011
FRONTEND_PORT=3000
LOG_DIR="/var/log/dryclean-deploy"
IMAGE_TAG="${1:-}"
ROLLBACK_REASON="${2:-Manual rollback}"

if [ -z "$IMAGE_TAG" ]; then
    echo "Usage: rollback-vps.sh <IMAGE_TAG> [REASON]"
    echo ""
    echo "Available images:"
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | grep dryclean | head -15
    exit 1
fi

mkdir -p "$LOG_DIR"
ROLLBACK_LOG="$LOG_DIR/rollback-$(date +%Y%m%d-%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ROLLBACK_LOG"; }
fatal() { log "FATAL: $1"; exit 1; }

GHCR_REGISTRY="${GHCR_REGISTRY:-ghcr.io}"
GHCR_REPO="${GHCR_REPO:-}"
FRONTEND_IMAGE="${GHCR_REGISTRY}/${GHCR_REPO,,}/dryclean/frontend:${IMAGE_TAG}"
CONTENT_IMAGE="${GHCR_REGISTRY}/${GHCR_REPO,,}/dryclean/content:${IMAGE_TAG}"

ROLLBACK_START=$(date +%s)
cd "$APP_DIR" || fatal "App dir not found"

[ -f .env ] || fatal ".env not found"
source .env

log "============================================"
log "ROLLBACK STARTED"
log "============================================"
log "Target frontend: $FRONTEND_IMAGE"
log "Target content:  $CONTENT_IMAGE"
log "Reason: $ROLLBACK_REASON"

# ── 1. Save current state ────────────────────────────────────────────────────

PREVIOUS_FRONTEND=$(docker inspect --format='{{.Config.Image}}' dryclean-frontend 2>/dev/null || echo "none")
PREVIOUS_CONTENT=$(docker inspect --format='{{.Config.Image}}' dryclean-content 2>/dev/null || echo "none")
log "Current frontend: $PREVIOUS_FRONTEND"
log "Current content:  $PREVIOUS_CONTENT"

# ── 2. DB backup ─────────────────────────────────────────────────────────────

BACKUP_FILE="$APP_DIR/backups/db_pre_rollback_$(date +%Y%m%d_%H%M%S).sql.gz"
if docker ps --format '{{.Names}}' | grep -q 'postgres'; then
    PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -1)
    docker exec "$PG_CONTAINER" pg_dump -U "${POSTGRES_USER:-dryclean}" "${POSTGRES_DB:-dryclean_content}" 2>/dev/null | gzip > "$BACKUP_FILE" 2>/dev/null || \
        log "WARN: DB backup failed"
fi
[ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ] && log "DB backup: $(du -h "$BACKUP_FILE" | cut -f1)"

# ── 3. Pull rollback images ─────────────────────────────────────────────────

log "Pulling rollback images..."
docker pull "$FRONTEND_IMAGE" 2>&1 | tail -3 || {
    log "Checking local cache..."
    docker image inspect "$FRONTEND_IMAGE" &>/dev/null || fatal "Frontend image not found: $FRONTEND_IMAGE"
}
docker pull "$CONTENT_IMAGE" 2>&1 | tail -3 || {
    log "Checking local cache..."
    docker image inspect "$CONTENT_IMAGE" &>/dev/null || fatal "Content image not found: $CONTENT_IMAGE"
}

# ── 4. Replace containers ────────────────────────────────────────────────────

log "Stopping current containers..."
docker stop dryclean-frontend 2>/dev/null || true
docker rm dryclean-frontend 2>/dev/null || true
docker stop dryclean-content 2>/dev/null || true
docker rm dryclean-content 2>/dev/null || true

log "Starting rollback containers..."

docker run -d \
    --name dryclean-content \
    --network dryclean-net \
    --restart unless-stopped \
    -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@dryclean-postgres:5432/${POSTGRES_DB:-dryclean_content}" \
    -e DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@dryclean-postgres:5432/${POSTGRES_DB:-dryclean_content}" \
    -e UPLOAD_DIR=/app/uploads \
    -v dryclean_uploads:/app/uploads \
    -p ${CONTENT_PORT}:8011 \
    "$CONTENT_IMAGE"

docker run -d \
    --name dryclean-frontend \
    --network dryclean-net \
    --restart unless-stopped \
    -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
    -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
    -p ${FRONTEND_PORT}:3000 \
    "$FRONTEND_IMAGE"

# ── 5. Health check ──────────────────────────────────────────────────────────

log "Waiting for health check..."
HEALTH_OK=0
for i in $(seq 1 24); do
    CONTENT_HEALTH=$(curl -sf --max-time 5 "http://127.0.0.1:${CONTENT_PORT}/health" 2>/dev/null || echo "")
    if echo "$CONTENT_HEALTH" | grep -q "ok\|healthy"; then
        log "Content API health check passed (attempt $i)"
        HEALTH_OK=1
        break
    fi
    if [ $((i % 4)) -eq 0 ]; then
        log "  Still waiting... ($i attempts)"
    fi
    sleep 5
done

if [ "$HEALTH_OK" -eq 0 ]; then
    log "FATAL: Rollback health check failed"
    log "Restoring previous containers..."

    docker stop dryclean-frontend dryclean-content 2>/dev/null || true
    docker rm dryclean-frontend dryclean-content 2>/dev/null || true

    if [ "$PREVIOUS_FRONTEND" != "none" ]; then
        docker run -d \
            --name dryclean-content \
            --network dryclean-net \
            --restart unless-stopped \
            -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@dryclean-postgres:5432/${POSTGRES_DB:-dryclean_content}" \
            -e DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@dryclean-postgres:5432/${POSTGRES_DB:-dryclean_content}" \
            -e UPLOAD_DIR=/app/uploads \
            -v dryclean_uploads:/app/uploads \
            -p ${CONTENT_PORT}:8011 \
            "$PREVIOUS_CONTENT"

        docker run -d \
            --name dryclean-frontend \
            --network dryclean-net \
            --restart unless-stopped \
            -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
            -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
            -p ${FRONTEND_PORT}:3000 \
            "$PREVIOUS_FRONTEND"

        sleep 15
        log "Previous containers restored"
    fi

    docker logs dryclean-content --tail=30 2>&1 | tee -a "$ROLLBACK_LOG"
    docker logs dryclean-frontend --tail=30 2>&1 | tee -a "$ROLLBACK_LOG"
    fatal "Rollback failed"
fi

# ── 6. Nginx reload ──────────────────────────────────────────────────────────

if command -v nginx &>/dev/null; then
    nginx -t 2>&1 && nginx -s reload 2>&1 || log "WARN: nginx reload failed"
    log "Nginx reloaded"
fi

# ── 7. Success ───────────────────────────────────────────────────────────────

ROLLBACK_TIME=$(( $(date +%s) - ROLLBACK_START ))
log "============================================"
log "ROLLBACK SUCCESSFUL"
log "============================================"
log "Time: ${ROLLBACK_TIME}s"
log "From: $PREVIOUS_FRONTEND / $PREVIOUS_CONTENT"
log "To:   $FRONTEND_IMAGE / $CONTENT_IMAGE"

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep dryclean || true

log "=== ROLLBACK FINISHED ==="
