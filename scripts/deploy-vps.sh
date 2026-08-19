#!/bin/bash
set -euo pipefail

APP_DIR="/opt/app"
CONTENT_PORT=8011
FRONTEND_PORT=3000
TRACKING_PORT=8020
PROMETHEUS_PORT=9090
GRAFANA_PORT=3030
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
TRACKING_IMAGE="${GHCR_REGISTRY}/${GHCR_REPO,,}/dryclean/tracking:${IMAGE_TAG}"

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
log "Tracking: $TRACKING_IMAGE"
log "Commit: $COMMIT_SHA"
log "Reason: $DEPLOY_REASON"
log "Initiator: ${GITHUB_ACTOR:-manual}"

# ── Step 1: Pre-flight checks ────────────────────────────────────────────────

log "── Step 1: Pre-flight checks ──"

[ -f .env ] || fatal ".env not found in $APP_DIR"
source .env

# ── Step 1.1: Docker image cleanup (before disk gate) ────────────────────────
# Old deploys accumulate ghcr images; end-of-deploy cleanup never runs when
# disk is already full. Prune early so regular deploys do not stall.

if command -v docker &>/dev/null; then
    log "── Step 1.1: Docker image cleanup ──"
    docker image prune -f >/dev/null 2>&1 || true
    KEEP_IMAGES_EARLY=4
    OLD_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" 2>/dev/null | grep -E "ghcr.io.*dryclean" | grep -v "<none>" || true)
    if [ -n "$OLD_IMAGES" ]; then
        echo "$OLD_IMAGES" | tail -n +$((KEEP_IMAGES_EARLY + 1)) | while read -r img; do
            docker rmi "$img" >/dev/null 2>&1 || true
        done
        docker image prune -f >/dev/null 2>&1 || true
    fi
    log "  Disk after cleanup: $(df -m "$APP_DIR" | tail -1 | awk '{print $4}')MB free"
fi

# ── Step 1.15: TLS certificate check & renewal ───────────────────────────────
# The compose certbot loop (docker-compose.prod.yml) is no longer running
# under the docker-run deploy model — certificates are renewed here instead.
# Runs BEFORE the disk gate so a full disk cannot block an emergency cert fix
# (renewal needs only a few MB). Idempotent: no-op while cert is valid ≥30d.

if [ -f "$(dirname "$0")/renew-cert.sh" ]; then
    log "── Step 1.15: TLS certificate check/renewal ──"
    bash "$(dirname "$0")/renew-cert.sh" 2>&1 | tee -a "$DEPLOY_LOG" || fatal "TLS certificate renewal failed"
else
    log "  WARN: scripts/renew-cert.sh not found — skipping certificate renewal"
fi

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

# ── Step 1.5: Ensure firewall does NOT lock out SSH ──────────────────────────
# UFW causes lockouts on this VPS — disable it if active.
# Port security is handled by binding Docker ports to 127.0.0.1 (see -p flags).

if command -v ufw &>/dev/null; then
    if ufw status 2>/dev/null | grep -q "Status: active"; then
        log "── Step 1.5: Disabling UFW (unsafe on this VPS) ──"
        ufw --force disable >/dev/null 2>&1 || true
        log "  UFW disabled — ports protected by 127.0.0.1 binding"
    else
        log "── Step 1.5: UFW inactive (OK) — ports protected by 127.0.0.1 binding ──"
    fi
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

log "  Pulling: $TRACKING_IMAGE"
docker pull "$TRACKING_IMAGE" 2>&1 | tail -3 || log "  WARN: Tracking image not found in registry, will skip tracking deployment"

PULL_TIME=$(( $(date +%s) - PULL_START ))
log "  Images ready in ${PULL_TIME}s"

# ── Step 5: Deploy ───────────────────────────────────────────────────────────

deploy_direct() {
    log "── Direct Deploy (no BLUE running) ──"

    docker rm -f dryclean-frontend dryclean-content dryclean-postgres \
        dryclean-redis dryclean-tracking dryclean-prometheus dryclean-grafana \
        dryclean-postgres-exporter \
        dryclean-frontend-green dryclean-content-green dryclean-tracking-green \
        frontend-blue content-blue tracking-blue postgres-blue \
        2>/dev/null || true

    log "  Cleaning up all containers on deploy ports..."
    for port in ${FRONTEND_PORT} ${CONTENT_PORT} ${TRACKING_PORT} ${PROMETHEUS_PORT} ${GRAFANA_PORT}; do
        for cid in $(docker ps -q --filter "publish=${port}" 2>/dev/null); do
            cname=$(docker inspect --format '{{.Name}}' "$cid" 2>/dev/null | sed 's/^\///') || cname="$cid"
            log "  Force-removing container '${cname}' (id=${cid}) on port ${port}"
            docker rm -f "$cid" 2>/dev/null || true
        done
    done

    sleep 3

    for port in ${CONTENT_PORT} ${FRONTEND_PORT} ${TRACKING_PORT}; do
        if docker ps --format '{{.Ports}}' | grep -q ":${port}->" 2>/dev/null; then
            log "  WARN: Port ${port} still allocated after cleanup!"
            docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}' 2>/dev/null | tee -a "$DEPLOY_LOG"
        fi
    done

    docker network rm dryclean-net 2>/dev/null || true
    docker network create --subnet 172.22.0.0/16 dryclean-net 2>/dev/null || true

    docker run -d \
        --name dryclean-postgres \
        --network dryclean-net \
        --network-alias postgres \
        --ip 172.22.0.3 \
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

    sleep 3
    POSTGRES_IP=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dryclean-postgres 2>/dev/null || echo "")
    if [ -z "$POSTGRES_IP" ]; then
        log "  WARN: Could not get postgres IP, using hostname"
        POSTGRES_HOST="dryclean-postgres"
    else
        log "  PostgreSQL IP: ${POSTGRES_IP}"
        POSTGRES_HOST="$POSTGRES_IP"
    fi

    docker run -d \
        --name dryclean-content \
        --network dryclean-net \
        --ip 172.22.0.2 \
        --restart unless-stopped \
        -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e UPLOAD_DIR=/app/uploads \
        -v dryclean_uploads:/app/uploads \
        -p 127.0.0.1:${CONTENT_PORT}:8011 \
        "$CONTENT_IMAGE"

    if ! wait_for_health "$CONTENT_PORT" "dryclean-content" 90 "/health"; then
        docker logs dryclean-content --tail=30 2>&1 | tee -a "$DEPLOY_LOG"
        fatal "Content service failed health check"
    fi

    log "  Starting tracking service on port ${TRACKING_PORT}..."
    docker run -d \
        --name dryclean-tracking \
        --network dryclean-net \
        --network-alias tracking-blue \
        --ip 172.22.0.4 \
        --restart unless-stopped \
        -e TRACKING_DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e TRACKING_DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e TRACKING_CORS_ORIGINS='["https://da-dryclean.ru"]' \
        -e TRACKING_DEBUG=false \
        -p 127.0.0.1:${TRACKING_PORT}:8020 \
        "$TRACKING_IMAGE"

    if ! wait_for_health "$TRACKING_PORT" "dryclean-tracking" 60 "/health"; then
        log "  WARN: Tracking service health check timeout (non-fatal)"
        sleep 3
    fi

    log "  Running tracking database migrations..."
    docker exec dryclean-tracking alembic upgrade head 2>&1 | tee -a "$DEPLOY_LOG" || log "  WARN: Tracking migration failed (tables may already exist)"

    docker run -d \
        --name dryclean-frontend \
        --network dryclean-net \
        --ip 172.22.0.10 \
        --restart unless-stopped \
        -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
        -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
        -p 127.0.0.1:${FRONTEND_PORT}:3000 \
        "$FRONTEND_IMAGE"

    if ! wait_for_health "$FRONTEND_PORT" "dryclean-frontend" 60 "/"; then
        log "  WARN: Frontend health check timeout"
        sleep 5
    fi
}

deploy_blue_green() {
    log "── Blue-Green Deploy ──"

    POSTGRES_IP=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dryclean-postgres 2>/dev/null || echo "")
    if [ -z "$POSTGRES_IP" ]; then
        POSTGRES_HOST="dryclean-postgres"
    else
        log "  PostgreSQL IP: ${POSTGRES_IP}"
        POSTGRES_HOST="$POSTGRES_IP"
    fi

    docker rm -f dryclean-frontend-green 2>/dev/null || true
    docker rm -f dryclean-content-green 2>/dev/null || true
    docker rm -f dryclean-tracking-green 2>/dev/null || true

    log "  Starting GREEN content on port ${GREEN_CONTENT_PORT}..."
    docker run -d \
        --name dryclean-content-green \
        --network dryclean-net \
        --ip 172.22.0.12 \
        --restart no \
        -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e UPLOAD_DIR=/app/uploads \
        -v dryclean_uploads:/app/uploads \
        -p 127.0.0.1:${GREEN_CONTENT_PORT}:8011 \
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
        --ip 172.22.0.11 \
        --restart no \
        -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
        -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
        -p 127.0.0.1:${GREEN_FRONTEND_PORT}:3000 \
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
    docker stop dryclean-tracking 2>/dev/null || true
    docker rm dryclean-tracking 2>/dev/null || true

    log "  Starting production containers on BLUE ports..."
    docker run -d \
        --name dryclean-content \
        --network dryclean-net \
        --ip 172.22.0.2 \
        --restart unless-stopped \
        -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e UPLOAD_DIR=/app/uploads \
        -v dryclean_uploads:/app/uploads \
        -p 127.0.0.1:${CONTENT_PORT}:8011 \
        "$CONTENT_IMAGE"

    if ! wait_for_health "$CONTENT_PORT" "dryclean-content" 90 "/health"; then
        log "  WARN: New content container failed, nginx stays on GREEN"
        docker rm -f dryclean-content 2>/dev/null || true
        fatal "New container failed — GREEN still serving"
    fi

    log "  Starting production tracking on port ${TRACKING_PORT}..."
    docker run -d \
        --name dryclean-tracking \
        --network dryclean-net \
        --network-alias tracking-blue \
        --ip 172.22.0.4 \
        --restart unless-stopped \
        -e TRACKING_DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e TRACKING_DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
        -e TRACKING_CORS_ORIGINS='["https://da-dryclean.ru"]' \
        -e TRACKING_DEBUG=false \
        -p 127.0.0.1:${TRACKING_PORT}:8020 \
        "$TRACKING_IMAGE"

    if ! wait_for_health "$TRACKING_PORT" "dryclean-tracking" 60 "/health"; then
        log "  WARN: Tracking service health check timeout (non-fatal)"
        sleep 3
    fi

    log "  Running tracking database migrations..."
    docker exec dryclean-tracking alembic upgrade head 2>&1 | tee -a "$DEPLOY_LOG" || log "  WARN: Tracking migration failed"

    docker run -d \
        --name dryclean-frontend \
        --network dryclean-net \
        --ip 172.22.0.10 \
        --restart unless-stopped \
        -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
        -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
        -p 127.0.0.1:${FRONTEND_PORT}:3000 \
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
    docker rm -f dryclean-tracking-green 2>/dev/null || true
    log "  GREEN containers removed"
}

# ── Execute deploy ──

# Сеть с фиксированной подсетью: embedded DNS сломан ядром VPS (5.2.0),
# межконтейнерная связность держится на статических IP (ЧТЗ_Фикс_Docker_DNS_VPS):
#   postgres 172.22.0.3, content 172.22.0.2, tracking 172.22.0.4,
#   postgres-exporter 172.22.0.5, frontend 172.22.0.10,
#   green: frontend 172.22.0.11, content 172.22.0.12 (tracking .14 — зарезервировано)
ensure_network() {
    if docker network inspect dryclean-net &>/dev/null; then
        if docker network inspect dryclean-net --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}' | grep -q '172.22.0.0/16'; then
            log "  Network dryclean-net OK (172.22.0.0/16)"
        else
            log "  WARN: dryclean-net exists with другой подсетью — статические IP могут не примениться"
            log " WARN: выполните scripts/check-dns.sh --migrate-network в окне обслуживания"
        fi
    else
        docker network create --subnet 172.22.0.0/16 dryclean-net
        log "  Network dryclean-net created (172.22.0.0/16)"
    fi
}
ensure_network

if [ "$BLUE_HEALTHY" -eq 1 ]; then
    deploy_blue_green
else
    deploy_direct
fi

# ── Step 5.5: Monitoring setup (Prometheus + Grafana) ──────────────────────────

setup_monitoring() {
    log "── Monitoring Setup (Prometheus + Grafana) ──"

    MONITORING_DIR="$APP_DIR/monitoring"
    mkdir -p "$MONITORING_DIR/grafana/provisioning/datasources"
    mkdir -p "$MONITORING_DIR/grafana/provisioning/dashboards"
    mkdir -p "$MONITORING_DIR/grafana/dashboards"

    # ⚠️ Embedded DNS сломан ядром VPS — таргеты по статическим IP (TASK-DNS-4).
    # Файл перегенерируется (с бэкапом), чтобы мигрировать старые hostname-таргеты.
    if [ -f "$MONITORING_DIR/prometheus.yml" ]; then
        cp "$MONITORING_DIR/prometheus.yml" "$MONITORING_DIR/prometheus.yml.bak-$(date +%Y%m%d-%H%M%S)"
    fi
    log "  Writing production Prometheus config (static IP targets)..."
    cat > "$MONITORING_DIR/prometheus.yml" <<'PROMEOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - /etc/prometheus/alerts.yml

scrape_configs:
  - job_name: "tracking"
    static_configs:
      - targets: ["172.22.0.4:8020"]
    metrics_path: /metrics

  - job_name: "content"
    static_configs:
      - targets: ["172.22.0.2:8011"]
    metrics_path: /metrics

  - job_name: "postgres-exporter"
    static_configs:
      - targets: ["172.22.0.5:9187"]
    metrics_path: /metrics

  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
PROMEOF

    # Alert rules: pg_up == 0 5m и недоступность exporter'а (TASK-DNS-4)
    if [ -f "$APP_DIR/monitoring/prometheus.alerts.yml" ]; then
        cp "$APP_DIR/monitoring/prometheus.alerts.yml" "$MONITORING_DIR/prometheus.alerts.yml"
        log "  Alert rules installed from repo (monitoring/prometheus.alerts.yml)"
    else
        cat > "$MONITORING_DIR/prometheus.alerts.yml" <<'ALERTEOF'
groups:
  - name: postgres
    rules:
      - alert: PostgresExporterUnreachable
        expr: up{job="postgres-exporter"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "postgres-exporter недоступен (172.22.0.5:9187)"
          description: "Свой Prometheus не может скрейпить postgres-exporter более 5 минут."

      - alert: PgUpZero
        expr: pg_up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "pg_up = 0 — exporter не подключён к PostgreSQL"
          description: "postgres-exporter не может подключиться к БД более 5 минут (ЧТЗ_Фикс_Docker_DNS_VPS, TASK-DNS-4)."

  - name: services
    rules:
      - alert: TrackingMetricsDown
        expr: up{job="tracking"} == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "tracking /metrics недоступен (172.22.0.4:8020)"
          description: "Prometheus не получает метрики tracking более 5 минут."

      - alert: ContentMetricsDown
        expr: up{job="content"} == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "content /metrics недоступен (172.22.0.2:8011)"
          description: "Prometheus не получает метрики content более 5 минут."
ALERTEOF
        log "  Alert rules written (pg_up == 0 на 5 минут)"
    fi

    if [ ! -f "$MONITORING_DIR/grafana/provisioning/datasources/datasources.yml" ]; then
        log "  Creating production Grafana datasources..."
        cat > "$MONITORING_DIR/grafana/provisioning/datasources/datasources.yml" <<DSEOF
apiVersion: 1

datasources:
  - name: PostgreSQL
    uid: PostgreSQL
    type: postgres
    access: proxy
    url: dryclean-postgres:5432
    user: ${POSTGRES_USER:-dryclean}
    secureJsonData:
      password: ${POSTGRES_PASSWORD}
    jsonData:
      database: ${POSTGRES_DB:-dryclean_content}
      sslmode: disable
      postgresVersion: 1600
      timescaledb: false
    isDefault: false

  - name: Prometheus
    uid: Prometheus
    type: prometheus
    access: proxy
    url: http://dryclean-prometheus:9090
    isDefault: true
DSEOF
    fi

    if [ ! -f "$MONITORING_DIR/grafana/provisioning/dashboards/dashboard_provider.yml" ]; then
        cat > "$MONITORING_DIR/grafana/provisioning/dashboards/dashboard_provider.yml" <<'DPEOF'
apiVersion: 1

providers:
  - name: "Business Analytics"
    orgId: 1
    folder: ""
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: false
DPEOF
    fi

    if [ -f "$APP_DIR/monitoring/grafana/dashboards/business_analytics.json" ]; then
        log "  Dashboard config already present"
    else
        log "  WARN: No Grafana dashboard JSON found at $MONITORING_DIR/grafana/dashboards/"
        log "  You can manually copy it from the repo later"
    fi

    docker rm -f dryclean-prometheus 2>/dev/null || true
    docker rm -f dryclean-grafana 2>/dev/null || true

    log "  Starting Prometheus on port ${PROMETHEUS_PORT}..."
    docker run -d \
        --name dryclean-prometheus \
        --network dryclean-net \
        --restart unless-stopped \
        -p 127.0.0.1:${PROMETHEUS_PORT}:9090 \
        -v "$MONITORING_DIR/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
        -v "$MONITORING_DIR/prometheus.alerts.yml:/etc/prometheus/alerts.yml:ro" \
        -v dryclean_prometheus:/prometheus \
        prom/prometheus:v2.53.0 \
        --config.file=/etc/prometheus/prometheus.yml \
        --storage.tsdb.path=/prometheus \
        --storage.tsdb.retention.time=15d

    sleep 5

    if curl -sf --max-time 5 "http://127.0.0.1:${PROMETHEUS_PORT}/-/healthy" >/dev/null 2>&1; then
        log "  Prometheus is healthy"
    else
        log "  WARN: Prometheus health check failed"
    fi

    GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-dryclean2026}"
    GRAFANA_BASIC_AUTH_USER="${GRAFANA_BASIC_AUTH_USER:-admin}"
    GRAFANA_BASIC_AUTH_PASSWORD="${GRAFANA_BASIC_AUTH_PASSWORD:-${GRAFANA_ADMIN_PASSWORD}}"

    log "  Generating nginx basic-auth for Grafana..."
    if command -v htpasswd &>/dev/null; then
        htpasswd -bc /etc/nginx/.htpasswd_grafana "$GRAFANA_BASIC_AUTH_USER" "$GRAFANA_BASIC_AUTH_PASSWORD" 2>/dev/null
    elif command -v openssl &>/dev/null; then
        local _hash
        _hash=$(openssl passwd -apr1 "$GRAFANA_BASIC_AUTH_PASSWORD")
        printf "%s:%s\n" "$GRAFANA_BASIC_AUTH_USER" "$_hash" > /etc/nginx/.htpasswd_grafana
    else
        log "  WARN: Neither htpasswd nor openssl found — Grafana basic-auth NOT configured"
    fi
    nginx -t 2>&1 && nginx -s reload 2>&1 || log "  WARN: nginx reload failed"

    log "  Starting Grafana on port ${GRAFANA_PORT} (behind nginx /grafana/)..."
    docker run -d \
        --name dryclean-grafana \
        --network dryclean-net \
        --restart unless-stopped \
        -e GF_SECURITY_ADMIN_USER=admin \
        -e "GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}" \
        -e GF_AUTH_ANONYMOUS_ENABLED=false \
        -e GF_SERVER_ROOT_URL="https://da-dryclean.ru/grafana/" \
        -e GF_SERVER_SERVE_FROM_SUB_PATH=true \
        -v dryclean_grafana:/var/lib/grafana \
        -v "$MONITORING_DIR/grafana/provisioning:/etc/grafana/provisioning:ro" \
        -v "$MONITORING_DIR/grafana/dashboards:/var/lib/grafana/dashboards:ro" \
        -p 127.0.0.1:${GRAFANA_PORT}:3000 \
        grafana/grafana:11.1.0

    if ! wait_for_health "$GRAFANA_PORT" "dryclean-grafana" 60 "/api/health"; then
        log "  WARN: Grafana health check timeout"
        sleep 3
    else
        log "  Grafana is healthy (accessible at https://da-dryclean.ru/grafana/)"
    fi
}

setup_monitoring

# ── Step 5.7: Metrics export setup (central monitoring) ──────────────────────

setup_metrics_export() {
    log "── Metrics Export Setup (central monitoring) ──"

    if [ ! -f "$APP_DIR/scripts/setup-metrics-export.sh" ]; then
        log "  WARN: scripts/setup-metrics-export.sh not found — skipping"
        return 0
    fi

    if ! grep -q "^MONITORING_API_KEY=" "$APP_DIR/.env"; then
        openssl rand -hex 24 | sed 's/^/MONITORING_API_KEY=/' >> "$APP_DIR/.env"
        chmod 600 "$APP_DIR/.env"
        log "  Generated MONITORING_API_KEY (stored in $APP_DIR/.env, chmod 600)"
    else
        log "  Reusing MONITORING_API_KEY from $APP_DIR/.env"
    fi

    METRICS_KEY=$(grep "^MONITORING_API_KEY=" "$APP_DIR/.env" | cut -d= -f2-)

    if bash "$APP_DIR/scripts/setup-metrics-export.sh" --key "$METRICS_KEY" 2>&1 | tee -a "$DEPLOY_LOG"; then
        log "  Metrics export configured and verified"
    else
        fatal "Metrics export setup failed"
    fi
}

setup_metrics_export

# ── Step 6: Smoke tests ─────────────────────────────────────────────────────

log "── Step 6: Smoke tests ──"
SMOKE_FAIL=0

endpoints=(
    "GET|200|${CONTENT_PORT}|/health|Content API Health"
    "GET|200|${FRONTEND_PORT}|/|Frontend Homepage"
    "GET|200|${TRACKING_PORT}|/health|Tracking Service Health"
    "GET|200|${PROMETHEUS_PORT}|/-/healthy|Prometheus Health"
    "GET|200|${GRAFANA_PORT}|/api/health|Grafana Health"
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
            --ip 172.22.0.2 \
            --restart unless-stopped \
            -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
            -e DATABASE_URL_SYNC="postgresql+psycopg2://${POSTGRES_USER:-dryclean}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB:-dryclean_content}" \
            -e UPLOAD_DIR=/app/uploads \
            -v dryclean_uploads:/app/uploads \
            -p 127.0.0.1:${CONTENT_PORT}:8011 \
            "$PREVIOUS_CONTENT"

        docker run -d \
            --name dryclean-frontend \
            --network dryclean-net \
            --ip 172.22.0.10 \
            --restart unless-stopped \
            -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}" \
            -e NEXT_PUBLIC_CONTENT_API_URL="${NEXT_PUBLIC_CONTENT_API_URL:-/api/content}" \
            -p 127.0.0.1:${FRONTEND_PORT}:3000 \
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
log "Tracking: $TRACKING_IMAGE"
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
