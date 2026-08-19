#!/bin/bash
# Setup of metrics export for the central monitoring project (ЧТЗ_Сайт_da-dryclean_Метрики).
# Run ON THE VPS as root:  ./scripts/setup-metrics-export.sh --key <MONITORING_API_KEY>
set -euo pipefail

APP_DIR="/opt/app"
NGINX_MAIN_CONF="/etc/nginx/nginx.conf"
NGINX_KEY_CONF="/etc/nginx/conf.d/monitoring-key.conf"
ENV_FILE="$APP_DIR/.env"
DOMAIN="da-dryclean.ru"
NODE_EXPORTER_VERSION="${NODE_EXPORTER_VERSION:-}"
POSTGRES_EXPORTER_IMAGE="prometheuscommunity/postgres-exporter:latest"
KEY=""

log()  { echo "[setup-metrics] $1"; }
fatal(){ echo "[setup-metrics] FATAL: $1" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --key) KEY="$2"; shift 2 ;;
        --skip-nginx) SKIP_NGINX=1; shift ;;
        --skip-node) SKIP_NODE=1; shift ;;
        --skip-postgres) SKIP_POSTGRES=1; shift ;;
        --skip-verify) SKIP_VERIFY=1; shift ;;
        *) fatal "Unknown argument: $1" ;;
    esac
done

KEY="${KEY:-${MONITORING_API_KEY:-}}"
[ -n "$KEY" ] || fatal "Monitoring key required: pass --key <X-Monitoring-Key> or set MONITORING_API_KEY"
[[ "$(id -u)" == "0" ]] || fatal "Run as root"
[ -f "$ENV_FILE" ] || fatal "$ENV_FILE not found"
[ -f "$NGINX_MAIN_CONF" ] || fatal "$NGINX_MAIN_CONF not found"

# ── 1. Nginx: key file + metrics locations ──────────────────────────────────
if [ -z "${SKIP_NGINX:-}" ]; then
    log "── nginx: monitoring key file ──"
    mkdir -p /etc/nginx/conf.d
    BACKUP="$NGINX_MAIN_CONF.backup-$(date +%Y%m%d-%H%M%S)"
    cp "$NGINX_MAIN_CONF" "$BACKUP"
    log "  backup: $BACKUP"

    cat > "$NGINX_KEY_CONF" <<EOF
# managed by scripts/setup-metrics-export.sh — DO NOT COMMIT
# 48-hex-char keys exceed the default 64-byte map hash bucket
map_hash_bucket_size 128;
map \$http_x_monitoring_key \$metrics_key_ok {
    default 0;
    "$KEY" 1;
}

limit_req_zone \$binary_remote_addr zone=metrics_limit:10m rate=10r/s;
EOF
    chown root:root "$NGINX_KEY_CONF"
    chmod 600 "$NGINX_KEY_CONF"

    if ! grep -q "monitoring-key.conf" "$NGINX_MAIN_CONF"; then
        if grep -qE 'include\s+/etc/nginx/conf\.d/\*\.conf' "$NGINX_MAIN_CONF"; then
            log "  conf.d/*.conf already included — key file will be loaded"
        else
            log "  adding include of monitoring-key.conf into http{} block"
            sed -i 's|^http\s*{|http {\n    include /etc/nginx/conf.d/monitoring-key.conf;|' "$NGINX_MAIN_CONF"
        fi
    fi

    if ! grep -q "location = /metrics/tracking" "$NGINX_MAIN_CONF"; then
        log "  inserting metrics locations into the 443 server block"
        METRICS_BLOCK_FILE=$(mktemp)
        cat > "$METRICS_BLOCK_FILE" <<EOF

        # ── Metrics export for central monitoring ── BEGIN
        location = /metrics/tracking {
            if (\$request_method != GET) { return 405; }
            if (\$metrics_key_ok = 0) { return 403; }
            limit_req zone=metrics_limit burst=20 nodelay;
            limit_req_status 429;
            proxy_pass http://127.0.0.1:8020/metrics;
            proxy_set_header Host \$host;
        }

        location = /metrics/content {
            if (\$request_method != GET) { return 405; }
            if (\$metrics_key_ok = 0) { return 403; }
            limit_req zone=metrics_limit burst=20 nodelay;
            limit_req_status 429;
            proxy_pass http://\$content_upstream/metrics;
            proxy_set_header Host \$host;
        }

        location = /metrics/node {
            if (\$request_method != GET) { return 405; }
            if (\$metrics_key_ok = 0) { return 403; }
            limit_req zone=metrics_limit burst=20 nodelay;
            limit_req_status 429;
            proxy_pass http://127.0.0.1:9100/metrics;
            proxy_set_header Host \$host;
        }

        location = /metrics/postgres {
            if (\$request_method != GET) { return 405; }
            if (\$metrics_key_ok = 0) { return 403; }
            limit_req zone=metrics_limit burst=20 nodelay;
            limit_req_status 429;
            proxy_pass http://127.0.0.1:9187/metrics;
            proxy_set_header Host \$host;
        }
        # ── Metrics export for central monitoring ── END
EOF
        # Insert after the server_name line of the FIRST server block that
        # listens on 443 (the main ssl server). Exact-match locations (=)
        # take priority over any regex/prefix locations, so the position
        # inside the block does not matter.
        awk -v blockfile="$METRICS_BLOCK_FILE" '
            /listen[[:space:]]+443/ { in_ssl = 1 }
            in_ssl && /server_name/ && !inserted {
                print
                while ((getline line < blockfile) > 0) print line
                inserted = 1
                next
            }
            { print }
        ' "$NGINX_MAIN_CONF" > "${NGINX_MAIN_CONF}.tmp"
        mv "${NGINX_MAIN_CONF}.tmp" "$NGINX_MAIN_CONF"
        rm -f "$METRICS_BLOCK_FILE"
    else
        log "  metrics locations already present — skipping insertion"
    fi

    grep -q "location = /metrics/tracking" "$NGINX_MAIN_CONF" \
        || fatal "metrics locations were not inserted — insert them manually into the 443 server block (see nginx/prod.conf) and re-run"

    if nginx -t 2>&1; then
        nginx -s reload
        log "  nginx reloaded"
    else
        log "  nginx -t FAILED — restoring backup"
        cp "$BACKUP" "$NGINX_MAIN_CONF"
        nginx -t && nginx -s reload || true
        fatal "nginx config rejected; manual review required"
    fi
fi

# ── 2. MONITORING_API_KEY in /opt/app/.env ──────────────────────────────────
if grep -q "^MONITORING_API_KEY=" "$ENV_FILE"; then
    sed -i "s|^MONITORING_API_KEY=.*$|MONITORING_API_KEY=$KEY|" "$ENV_FILE"
else
    printf "\nMONITORING_API_KEY=%s\n" "$KEY" >> "$ENV_FILE"
fi
chmod 600 "$ENV_FILE"
log "── MONITORING_API_KEY stored in $ENV_FILE (600) ──"

# ── 3. node_exporter on 127.0.0.1:9100 ──────────────────────────────────────
if [ -z "${SKIP_NODE:-}" ]; then
    log "── node_exporter ──"
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64)  ARCH_GO="amd64" ;;
        aarch64) ARCH_GO="arm64" ;;
        *) fatal "unsupported arch: $ARCH" ;;
    esac

    if [ -z "$NODE_EXPORTER_VERSION" ]; then
        NODE_EXPORTER_VERSION=$(curl -fsSL --max-time 10 https://api.github.com/repos/prometheus/node_exporter/releases/latest \
            | grep -o '"tag_name": *"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        NODE_EXPORTER_VERSION="${NODE_EXPORTER_VERSION:-v1.8.2}"
    fi
    log "  version: $NODE_EXPORTER_VERSION ($ARCH_GO)"

    if [ ! -x /usr/local/bin/node_exporter ]; then
        TARBALL="node_exporter-${NODE_EXPORTER_VERSION#v}.linux-${ARCH_GO}.tar.gz"
        curl -fsSL --max-time 120 -o "/tmp/$TARBALL" \
            "https://github.com/prometheus/node_exporter/releases/download/${NODE_EXPORTER_VERSION}/${TARBALL}"
        tar -xzf "/tmp/$TARBALL" -C /tmp
        install -m 0755 "/tmp/node_exporter-${NODE_EXPORTER_VERSION#v}.linux-${ARCH_GO}/node_exporter" /usr/local/bin/node_exporter
        rm -rf "/tmp/$TARBALL" "/tmp/node_exporter-${NODE_EXPORTER_VERSION#v}.linux-${ARCH_GO}"
    else
        log "  binary already installed"
    fi

    if ! id node_exporter &>/dev/null; then
        useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin node_exporter
    fi

    if [ ! -f /etc/systemd/system/node_exporter.service ]; then
        cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
ExecStart=/usr/local/bin/node_exporter --web.listen-address=127.0.0.1:9100
Restart=always
User=node_exporter
Group=node_exporter

[Install]
WantedBy=multi-user.target
EOF
    fi

    systemctl daemon-reload
    systemctl enable --now node_exporter
    sleep 2
    systemctl is-active --quiet node_exporter || fatal "node_exporter is not running"
    log "  node_exporter active on 127.0.0.1:9100"
fi

# ── 4. postgres_exporter on 127.0.0.1:9187 ──────────────────────────────────
if [ -z "${SKIP_POSTGRES:-}" ]; then
    log "── postgres_exporter ──"
    source "$ENV_FILE"
    PG_DB="${POSTGRES_DB:-dryclean_content}"

    PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '^(dryclean-postgres|postgres-blue|postgres-green|postgres)$' | head -1 || true)
    [ -n "$PG_CONTAINER" ] || fatal "postgres container not found"

    if grep -q "^POSTGRES_EXPORTER_PASSWORD=" "$ENV_FILE"; then
        EXPORTER_PASSWORD="${POSTGRES_EXPORTER_PASSWORD}"
    else
        EXPORTER_PASSWORD=$(openssl rand -hex 24)
        printf "POSTGRES_EXPORTER_PASSWORD=%s\n" "$EXPORTER_PASSWORD" >> "$ENV_FILE"
        log "  generated POSTGRES_EXPORTER_PASSWORD (stored in .env)"
    fi

    log "  creating read-only user metrics_exporter in $PG_CONTAINER"
    docker exec -i "$PG_CONTAINER" psql -U "${POSTGRES_USER:-dryclean}" -d "$PG_DB" <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metrics_exporter') THEN
        CREATE USER metrics_exporter LOGIN PASSWORD '$EXPORTER_PASSWORD';
    ELSE
        ALTER USER metrics_exporter WITH PASSWORD '$EXPORTER_PASSWORD';
    END IF;
END
\$\$;
GRANT CONNECT ON DATABASE $PG_DB TO metrics_exporter;
GRANT pg_monitor TO metrics_exporter;
SQL

    docker rm -f dryclean-postgres-exporter 2>/dev/null || true
    docker network create --subnet 172.22.0.0/16 dryclean-net 2>/dev/null || true

    # Embedded DNS сломан ядром VPS (127.0.0.11 connection refused):
    # exporter обязан ходить в postgres по IP, а не по имени
    # (ЧТЗ_Фикс_Docker_DNS_VPS, TASK-DNS-1).
    PG_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' "$PG_CONTAINER" | awk '{print $1}')
    [ -n "$PG_IP" ] || fatal "could not determine postgres IP for $PG_CONTAINER"
    log "  postgres $PG_CONTAINER IP: $PG_IP (статический адрес для extra_hosts)"

    docker run -d \
        --name dryclean-postgres-exporter \
        --network dryclean-net \
        --ip 172.22.0.5 \
        --add-host "postgres:${PG_IP}" \
        --add-host "dryclean-postgres:${PG_IP}" \
        --restart unless-stopped \
        -e DATA_SOURCE_NAME="postgresql://metrics_exporter:${EXPORTER_PASSWORD}@${PG_IP}:5432/${PG_DB}?sslmode=disable" \
        -p 127.0.0.1:9187:9187 \
        "$POSTGRES_EXPORTER_IMAGE"

    sleep 5
    curl -fsSL --max-time 10 "http://127.0.0.1:9187/metrics" | grep -q "^pg_" || fatal "postgres_exporter did not expose pg_ metrics"
    log "  postgres_exporter active on 127.0.0.1:9187"
fi

# ── 5. Acceptance checks (ЧТЗ, раздел 5) ────────────────────────────────────
if [ -z "${SKIP_VERIFY:-}" ]; then
    log "── acceptance verification via https://$DOMAIN ──"
    FAIL=0

    # Give old nginx workers (pre-reload, without metrics locations) time to
    # drain their keepalive connections, and warm the content service counter
    # series: prometheus_client emits no labeled series before the first
    # increment, and /metrics + /health are excluded from the middleware.
    sleep 3
    curl -s -o /dev/null --max-time 10 "https://$DOMAIN/api/__metrics_warmup" || true

    # retry wrapper: nginx reload worker overlap can transiently 404.
    # pipefail is disabled inside: grep -q exits on first match and SIGPIPEs
    # curl on responses larger than the 64KB pipe buffer (node_exporter ~85KB).
    check() {
        local desc="$1" expect="$2" cmd="$3" attempt
        for attempt in 1 2 3; do
            if ( set +o pipefail; eval "$cmd" ) >/dev/null 2>&1; then
                log "  OK: $desc"
                return 0
            fi
            log "  attempt $attempt/3 failed: $desc (expected $expect), retrying..."
            sleep 3
        done
        log "  FAIL: $desc (expected $expect)"
        FAIL=$((FAIL + 1))
    }

    check "no key -> 403 (tracking)" 403 \
        "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/metrics/tracking | grep -qx 403"
    check "business_ metrics present" ">0" \
        "curl -s -H 'X-Monitoring-Key: $KEY' https://$DOMAIN/metrics/tracking | grep -q '^business_'"
    check "content_ metrics present" "yes" \
        "curl -s -H 'X-Monitoring-Key: $KEY' https://$DOMAIN/metrics/content | grep -q '^content_http_'"
    check "node_ metrics present" "yes" \
        "curl -s -H 'X-Monitoring-Key: $KEY' https://$DOMAIN/metrics/node | grep -q '^node_cpu_seconds_total'"
    check "pg_ metrics present" "yes" \
        "curl -s -H 'X-Monitoring-Key: $KEY' https://$DOMAIN/metrics/postgres | grep -q '^pg_'"
    check "POST rejected with 405" 405 \
        "curl -s -o /dev/null -w '%{http_code}' -X POST -H 'X-Monitoring-Key: $KEY' https://$DOMAIN/metrics/tracking | grep -qx 405"

    log "  checking rate limit (40 parallel requests, expecting 429)..."
    BURST_TMP=$(mktemp)
    for i in $(seq 1 40); do
        curl -s -o /dev/null -w '%{http_code}\n' --max-time 10 \
            -H "X-Monitoring-Key: $KEY" "https://$DOMAIN/metrics/node" >> "$BURST_TMP" &
    done
    wait
    BURST_CODES=$(sort -u "$BURST_TMP" | tr '\n' ' ')
    rm -f "$BURST_TMP"
    log "  burst response codes: $BURST_CODES"
    if echo "$BURST_CODES" | grep -q 429; then
        log "  OK: rate limit returns 429 on burst"
    else
        log "  FAIL: rate limit did not trigger (codes: $BURST_CODES)"
        FAIL=$((FAIL + 1))
    fi

    if [ "$FAIL" -gt 0 ]; then
        fatal "acceptance checks failed: $FAIL"
    fi
    log "── all acceptance checks passed ──"
fi

log "DONE"
