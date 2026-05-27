#!/bin/bash
set -euo pipefail

APP_DIR="/opt/app"
CONTENT_PORT=8011
FRONTEND_PORT=3000
GREEN_CONTENT_PORT=8012
GREEN_FRONTEND_PORT=3001
LOG_DIR="/var/log/dryclean-deploy"
HEALTH_TIMEOUT=120
HEALTH_INTERVAL=5
IMAGE_TAG="${1:-latest}"
COMMIT_SHA="${2:-unknown}"
DEPLOY_REASON="${3:-Automated deploy}"

mkdir -p "$LOG_DIR" "$APP_DIR/backups"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"; }
fatal() { log "FATAL: $1"; exit 1; }

GHCR_REGISTRY="${GHCR_REGISTRY:-ghcr.io}"
GHCR_REPO="${GHCR_REPO:-}"
FRONTEND_IMAGE="${GHCR_REGISTRY}/${GHCR_REPO,,}/dryclean/frontend:${IMAGE_TAG}"
CONTENT_IMAGE="${GHCR_REGISTRY}/${GHCR_REPO,,}/dryclean/content:${IMAGE_TAG}"

wait_for_health() {
    local port="$1"
    local name="$2"
    local timeout="${3:-$HEALTH_TIMEOUT}"
    local path="${4:-/}"
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://127.0.0.1:${port}${path}" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
            log "    Health check passed for $name on port ${port} (${elapsed}s)"
            return 0
        fi
        sleep $HEALTH_INTERVAL
        elapsed=$((elapsed + HEALTH_INTERVAL))
        if [ $((elapsed % 20)) -eq 0 ]; then
            log "    Waiting for $name... (${elapsed}s/${timeout}s)"
        fi
    done

    log "    Health check FAILED for $name on port ${port} after ${timeout}s"
    return 1
}

DEPLOY_START=$(date +%s)
cd "$APP_DIR" || fatal "App dir not found: $APP_DIR"

log "============================================"
log "BLUE-GREEN DEPLOY STARTED"
log "============================================"
log "Image tag: $IMAGE_TAG"
log "Frontend: $FRONTEND_IMAGE"
log "Content:  $CONTENT_IMAGE"
log "Commit: $COMMIT_SHA"
log "Reason: $DEPLOY_REASON"
log "Initiator: ${GITHUB_ACTOR:-manual}"

# ── Step 1: Pre-flight checks ────────────────────────────────────────────────

log "── Step 1: Pre-flight checks ──"

[ -f .env ] || fatal ".env not found in $APP_DIR"
source .env

DISK_FREE=$(df -m "$APP_DIR" | tail -1 | awk '{print $4}')
if [ "$DISK_FREE" -lt 1024 ]; then
    fatal "Insufficient disk space: ${DISK_FREE}MB free (need 1GB)"
fi
log "  Disk: ${DISK_FREE}MB free"

if command -v docker &>/dev/null; then
    log "  Docker: $(docker --version)"
else
    fatal "Docker not found"
fi

if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    log "  Docker Compose: $(docker compose version --short)"
else
    fatal "Docker Compose not found"
fi

# ── Step 2: Database backup ──────────────────────────────────────────────────

log "── Step 2: Database backup ──"
BACKUP_FILE="$APP_DIR/backups/db_$(date +%Y%m%d_%H%M%S).sql.gz"

if docker ps --format '{{.Names}}' | grep -q 'postgres'; then
    PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -1)
    docker exec "$PG_CONTAINER" pg_dump -U "${POSTGRES_USER:-dryclean}" "${POSTGRES_DB:-dryclean_content}" 2>/dev/null | gzip > "$BACKUP_FILE" 2>/dev/null || \
        log "  WARN: DB backup failed (proceeding anyway)"
else
    log "  No postgres container found, skipping backup"
fi

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    log "  DB backup: $(du -h "$BACKUP_FILE" | cut -f1)"
fi

# ── Step 3: Determine current state ─────────────────────────────────────────

log "── Step 3: Determine current state ──"
BLUE_HEALTHY=0
PREVIOUS_FRONTEND=""
PREVIOUS_CONTENT=""

if docker ps --format '{{.Names}}' | grep -q '^dryclean-frontend$'; then
    PREVIOUS_FRONTEND=$(docker inspect --format='{{.Config.Image}}' dryclean-frontend 2>/dev/null || echo "unknown")
    if curl -sf --max-time 5 "http://127.0.0.1:${FRONTEND_PORT}/" -o /dev/null 2>/dev/null; then
        BLUE_HEALTHY=1
        log "  BLUE is healthy (frontend: ${PREVIOUS_FRONTEND})"
    else
        log "  BLUE is NOT healthy — will do direct deploy"
    fi
else
    log "  No BLUE container found — will do direct deploy"
fi

if docker ps --format '{{.Names}}' | grep -q '^dryclean-content$'; then
    PREVIOUS_CONTENT=$(docker inspect --format='{{.Config.Image}}' dryclean-content 2>/dev/null || echo "unknown")
fi

# ── Step 4: Pull images ─────────────────────────────────────────────────────

log "── Step 4: Pull Docker images ──"
PULL_START=$(date +%s)

log "  Pulling: $FRONTEND_IMAGE"
docker pull "$FRONTEND_IMAGE" 2>&1 | tail -3 || fatal "Failed to pull frontend image"

log "  Pulling: $CONTENT_IMAGE"
docker pull "$CONTENT_IMAGE" 2>&1 | tail -3 || fatal "Failed to pull content image"

PULL_TIME=$(( $(date +%s) - PULL_START ))
log "  Images ready in ${PULL_TIME}s"

# ── Step 5: Deploy ───────────────────────────────────────────────────────────

deploy_direct() {
    log "── Direct Deploy (no BLUE running) ──"

    docker rm -f dryclean-frontend 2>/dev/null || true
    docker rm -f dryclean-content 2>/dev/null || true
    docker rm -f dryclean-postgres 2>/dev/null || true
    docker rm -f dryclean-redis 2>/dev/null || true
    docker network create dryclean-net 2>/dev/null || true

    docker run -d \
        --name dryclean-postgres \
        --network dryclean-net \
        --restart unless-stopped \
        -e POSTGRES_USER="${POSTGRES_USER:-dryclean}" \
        -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
        -e POSTGRES_DB="${POSTGRES_DB:-dryclean_content}" \
        -v dryclean_postgres:/var/lib/postgresql/data \
        postgres:16

    log "  Waiting for PostgreSQL..."
    for i in $(seq 1 30); do
        if docker exec dryclean-postgres pg_isready -U "${POSTGRES_USER:-dryclean}" &>/dev/null; then
            log "  PostgreSQL ready"
            break
        fi
        sleep 2
    done

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

    if ! wait_for_health "$CONTENT_PORT" "dryclean-content" 90 "/health"; then
        docker logs dryclean-content --tail=30 2>&1 | tee -a "$DEPLOY_LOG"
        fatal "Content service failed health check"
    fi

    docker run -d \
        --name dryclean-frontend \
        --network dryclean-net \
        --restart unless-stopped \
        -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
        -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
        -p ${FRONTEND_PORT}:3000 \
        "$FRONTEND_IMAGE"

    if ! wait_for_health "$FRONTEND_PORT" "dryclean-frontend" 60 "/"; then
        log "  WARN: Frontend health check timeout"
        sleep 5
    fi
}

deploy_blue_green() {
    log "── Blue-Green Deploy ──"

    docker rm -f dryclean-frontend-green 2>/dev/null || true
    docker rm -f dryclean-content-green 2>/dev/null || true

    log "  Starting GREEN content on port ${GREEN_CONTENT_PORT}..."
    docker run -d \
        --name dryclean-content-green \
        --network dryclean-net \
        --restart no \
        -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@dryclean-postgres:5432/${POSTGRES_DB:-dryclean_content}" \
        -e DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@dryclean-postgres:5432/${POSTGRES_DB:-dryclean_content}" \
        -e UPLOAD_DIR=/app/uploads \
        -v dryclean_uploads:/app/uploads \
        -p ${GREEN_CONTENT_PORT}:8011 \
        "$CONTENT_IMAGE"

    if ! wait_for_health "$GREEN_CONTENT_PORT" "dryclean-content-green" 120 "/health"; then
        log "  === GREEN content FAILED health check ==="
        docker rm -f dryclean-content-green 2>/dev/null || true
        fatal "GREEN deployment failed — BLUE is still serving"
    fi
    log "  GREEN content is healthy"

    log "  Starting GREEN frontend on port ${GREEN_FRONTEND_PORT}..."
    docker run -d \
        --name dryclean-frontend-green \
        --network dryclean-net \
        --restart no \
        -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
        -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
        -p ${GREEN_FRONTEND_PORT}:3000 \
        "$FRONTEND_IMAGE"

    sleep 5

    log "  Switching nginx to GREEN..."
    if command -v nginx &>/dev/null; then
        mkdir -p /etc/nginx/conf.d
        cat > /etc/nginx/conf.d/active.conf <<EOF
set \$active_env "green";
EOF
        nginx -t 2>&1 && nginx -s reload 2>&1 || log "  WARN: nginx reload via CLI failed"
    fi

    log "  Stopping BLUE..."
    docker stop dryclean-frontend 2>/dev/null || true
    docker rm dryclean-frontend 2>/dev/null || true
    docker stop dryclean-content 2>/dev/null || true
    docker rm dryclean-content 2>/dev/null || true

    log "  Starting production containers on BLUE ports..."
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

    if ! wait_for_health "$CONTENT_PORT" "dryclean-content" 90 "/health"; then
        log "  WARN: New content container failed, nginx stays on GREEN"
        docker rm -f dryclean-content 2>/dev/null || true
        fatal "New container failed — GREEN still serving"
    fi

    docker run -d \
        --name dryclean-frontend \
        --network dryclean-net \
        --restart unless-stopped \
        -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
        -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
        -p ${FRONTEND_PORT}:3000 \
        "$FRONTEND_IMAGE"

    sleep 5

    log "  Switching nginx to BLUE..."
    if command -v nginx &>/dev/null; then
        cat > /etc/nginx/conf.d/active.conf <<EOF
set \$active_env "blue";
EOF
        nginx -t 2>&1 && nginx -s reload 2>&1 || log "  WARN: nginx reload failed"
    fi

    docker rm -f dryclean-frontend-green 2>/dev/null || true
    docker rm -f dryclean-content-green 2>/dev/null || true
    log "  GREEN containers removed"
}

# ── Execute deploy ──

docker network create dryclean-net 2>/dev/null || true

if [ "$BLUE_HEALTHY" -eq 1 ]; then
    deploy_blue_green
else
    deploy_direct
fi

# ── Step 6: Smoke tests ─────────────────────────────────────────────────────

log "── Step 6: Smoke tests ──"
SMOKE_FAIL=0

endpoints=(
    "GET|200|${CONTENT_PORT}|/health|Content API Health"
    "GET|200|${FRONTEND_PORT}|/|Frontend Homepage"
)

for ep in "${endpoints[@]}"; do
    IFS='|' read -r method expected_code port path name <<< "$ep"
    URL="http://127.0.0.1:${port}${path}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X "$method" "$URL" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "$expected_code" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        log "  OK: $name → $HTTP_CODE"
    else
        log "  FAIL: $name → $HTTP_CODE (expected $expected_code)"
        SMOKE_FAIL=$((SMOKE_FAIL + 1))
    fi
done

# ── Step 7: Auto-rollback ────────────────────────────────────────────────────

if [ "$SMOKE_FAIL" -gt 0 ]; then
    log "=== SMOKE TESTS FAILED ($SMOKE_FAIL failures) — AUTO ROLLBACK ==="

    if [ -n "$PREVIOUS_FRONTEND" ] && [ "$PREVIOUS_FRONTEND" != "unknown" ]; then
        log "  Rolling back to: $PREVIOUS_FRONTEND / $PREVIOUS_CONTENT"

        docker stop dryclean-frontend dryclean-content 2>/dev/null || true
        docker rm dryclean-frontend dryclean-content 2>/dev/null || true

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

        sleep 10

        if curl -sf --max-time 5 "http://127.0.0.1:${CONTENT_PORT}/health" >/dev/null 2>&1; then
            log "  Rollback successful — previous version is serving"
        else
            log "  FATAL: Rollback also failed — manual intervention required"
            docker logs dryclean-content --tail=50 2>&1 | tee -a "$DEPLOY_LOG"
            docker logs dryclean-frontend --tail=50 2>&1 | tee -a "$DEPLOY_LOG"
            fatal "Rollback failed"
        fi
    else
        log "  No previous image available for rollback"
    fi

    DEPLOY_TIME=$(( $(date +%s) - DEPLOY_START ))
    log "=== DEPLOY FAILED + ROLLED BACK in ${DEPLOY_TIME}s ==="
    exit 1
fi

# ── Step 8: Success ──────────────────────────────────────────────────────────

DEPLOY_TIME=$(( $(date +%s) - DEPLOY_START ))
log "============================================"
log "DEPLOYMENT SUCCESSFUL"
log "============================================"
log "Time: ${DEPLOY_TIME}s"
log "Frontend: $FRONTEND_IMAGE"
log "Content:  $CONTENT_IMAGE"
log "Commit: $COMMIT_SHA"

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep dryclean || true

# Cleanup
find "$APP_DIR/backups" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

KEEP_IMAGES=10
ALL_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "ghcr.io.*dryclean" | grep -v "<none>" || true)
IMAGE_COUNT=$(echo "$ALL_IMAGES" | grep -c . || echo "0")
if [ "$IMAGE_COUNT" -gt "$KEEP_IMAGES" ]; then
    echo "$ALL_IMAGES" | tail -n +$((KEEP_IMAGES + 1)) | while read -r img; do
        docker rmi "$img" 2>/dev/null || true
    done
fi
docker image prune -f 2>/dev/null || true

log "=== DEPLOY FINISHED ==="
