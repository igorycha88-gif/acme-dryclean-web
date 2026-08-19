#!/bin/bash
# Регресс-проверка DNS/связности контейнеров и метрик БД (TASK-DNS-5,
# ЧТЗ_Фикс_Docker_DNS_VPS). Запускать НА VPS (root) после каждого деплоя
# и любых инфраструктурных изменений:
#   ./scripts/check-dns.sh            — базовые проверки
#   ./scripts/check-dns.sh --strict   — embedded DNS обязателен (после обновления ядра)
#   ./scripts/check-dns.sh --migrate-network — пересоздать dryclean-net с подсетью
#                                               172.22.0.0/16 (окно обслуживания!)
set -uo pipefail

APP_DIR="/opt/app"
ENV_FILE="$APP_DIR/.env"
DOMAIN="da-dryclean.ru"
NET="dryclean-net"
SUBNET="172.22.0.0/16"
PG_IP_EXPECTED="172.22.0.3"
EXPORTER_IP_EXPECTED="172.22.0.5"

STRICT=0
MIGRATE=0
for arg in "$@"; do
    case "$arg" in
        --strict) STRICT=1 ;;
        --migrate-network) MIGRATE=1 ;;
        *) echo "Unknown argument: $arg"; exit 2 ;;
    esac
done

PASS=0; FAIL=0; WARN=0
ok()   { echo "  [ OK ] $1"; PASS=$((PASS+1)); }
bad()  { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN+1)); }

# ── --migrate-network: пересоздание сети с фиксированной подсетью ────────────
if [ "$MIGRATE" -eq 1 ]; then
    echo "== Migration: $NET → $SUBNET (окно обслуживания) =="
    ATTACHED=$(docker network inspect "$NET" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "")
    if [ -n "${ATTACHED// /}" ]; then
        echo "  К сети подключены контейнеры: $ATTACHED"
        echo "  Порядок действий:"
        echo "    1) cd $APP_DIR && docker ps --format '{{.Names}}' | grep dryclean | xargs docker stop"
        echo "    2) docker network rm $NET && docker network create --subnet $SUBNET $NET"
        echo "    3) повторный деплой: bash scripts/deploy-vps.sh (контейнеры получат статические IP)"
        echo "    4) bash scripts/setup-metrics-export.sh --key \$(grep ^MONITORING_API_KEY= .env | cut -d= -f2-)"
        exit 3
    fi
    docker network rm "$NET" 2>/dev/null || true
    docker network create --subnet "$SUBNET" "$NET"
    echo "  Сеть $NET пересоздана с подсетью $SUBNET — выполните деплой"
    exit 0
fi

echo "== 1. Сеть $NET =="
if docker network inspect "$NET" &>/dev/null; then
    ACTUAL_SUBNET=$(docker network inspect "$NET" --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
    if [ "$ACTUAL_SUBNET" = "$SUBNET" ]; then
        ok "сеть существует, подсеть $SUBNET"
    else
        bad "сеть существует, но подсеть '$ACTUAL_SUBNET' ≠ $SUBNET — статические IP не гарантированы. Запустите: $0 --migrate-network (в окно обслуживания)"
    fi
else
    bad "сеть $NET не найдена"
fi

echo "== 2. Embedded DNS Docker (127.0.0.11) =="
DNS_RESULT=$(docker run --rm --network "$NET" busybox nslookup dryclean-postgres 2>&1) && DNS_OK=1 || DNS_OK=0
if [ "$DNS_OK" -eq 1 ]; then
    ok "резолв dryclean-postgres работает (ядро обновлено?) — extra_hosts можно убрать"
elif [ "$STRICT" -eq 1 ]; then
    bad "embedded DNS не работает:$DNS_RESULT"
else
    warn "embedded DNS не работает (известное ограничение ядра 5.2.0, см. DEPLOY.md). Воркараунд: статические IP + extra_hosts"
fi

echo "== 3. Статические IP (воркараунд TASK-DNS-1) =="
PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '^(dryclean-postgres|postgres)$' | head -1 || true)
if [ -n "$PG_CONTAINER" ]; then
    PG_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' "$PG_CONTAINER" | awk '{print $1}')
    if [ "$PG_IP" = "$PG_IP_EXPECTED" ]; then
        ok "$PG_CONTAINER = $PG_IP"
    else
        bad "$PG_CONTAINER IP = '$PG_IP' (ожидалось $PG_IP_EXPECTED). Пересоздайте контейнер через deploy-vps.sh с --ip $PG_IP_EXPECTED"
    fi
else
    bad "postgres-контейнер не найден"
fi

EXPORTER_RUNNING=$(docker ps --format '{{.Names}}' | grep -c '^dryclean-postgres-exporter$' || true)
if [ "$EXPORTER_RUNNING" -ge 1 ]; then
    EXPORTER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' dryclean-postgres-exporter | awk '{print $1}')
    EXTRA_HOSTS=$(docker inspect -f '{{json .HostConfig.ExtraHosts}}' dryclean-postgres-exporter)
    if [ "$EXPORTER_IP" = "$EXPORTER_IP_EXPECTED" ]; then
        ok "dryclean-postgres-exporter = $EXPORTER_IP"
    else
        warn "dryclean-postgres-exporter IP = '$EXPORTER_IP' (план: $EXPORTER_IP_EXPECTED)"
    fi
    if echo "$EXTRA_HOSTS" | grep -q "postgres"; then
        ok "extra_hosts на exporter: $EXTRA_HOSTS"
    else
        bad "у exporter нет extra_hosts для postgres — рестарт сломает подключение к БД. Запустите scripts/setup-metrics-export.sh"
    fi
else
    bad "dryclean-postgres-exporter не запущен — метрики БД не собираются"
fi

echo "== 4. pg_up локально (127.0.0.1:9187) =="
PG_UP=$(curl -s --max-time 10 "http://127.0.0.1:9187/metrics" 2>/dev/null | grep -E '^pg_up ' | awk '{print $2}')
if [ "$PG_UP" = "1" ]; then
    ok "pg_up = 1 (exporter подключён к БД)"
else
    bad "pg_up = '${PG_UP:-нет данных}' — exporter не подключён к PostgreSQL"
fi

echo "== 5. pg_up через nginx (центральный путь) =="
if [ -f "$ENV_FILE" ]; then
    KEY=$(grep "^MONITORING_API_KEY=" "$ENV_FILE" | cut -d= -f2- || true)
    if [ -n "${KEY:-}" ]; then
        REMOTE_PG_UP=$(curl -s --max-time 15 -H "X-Monitoring-Key: $KEY" "https://$DOMAIN/metrics/postgres" 2>/dev/null | grep -E '^pg_up ' | awk '{print $2}')
        if [ "$REMOTE_PG_UP" = "1" ]; then
            ok "https://$DOMAIN/metrics/postgres → pg_up 1"
        else
            bad "https://$DOMAIN/metrics/postgres → pg_up '${REMOTE_PG_UP:-нет данных}'"
        fi
    else
        warn "MONITORING_API_KEY не найден в $ENV_FILE — внешний путь не проверен"
    fi
else
    warn "$ENV_FILE не найден — внешний путь не проверен"
fi

echo "== 6. Связность сервисов с postgres (по IP, воркараунд) =="
for SVC in dryclean-tracking dryclean-content; do
    if docker ps --format '{{.Names}}' | grep -q "^${SVC}$"; then
        if docker exec "$SVC" python -c "import socket; socket.create_connection(('${PG_IP:-172.22.0.3}', 5432), timeout=5)" 2>/dev/null \
           || docker exec "$SVC" sh -c "echo > /dev/tcp/${PG_IP:-172.22.0.3}/5432" 2>/dev/null; then
            ok "$SVC → ${PG_IP:-172.22.0.3}:5432 доступен"
        else
            warn "$SVC: не удалось проверить TCP до ${PG_IP:-172.22.0.3}:5432 (нет python/bash в образе — проверьте health)"
        fi
    fi
done

echo "======================================"
echo "ИТОГ: OK=$PASS FAIL=$FAIL WARN=$WARN"
[ "$FAIL" -eq 0 ] && echo "РЕГРЕСС-ПРОВЕРКА ПРОЙДЕНА" || { echo "РЕГРЕСС-ПРОВЕРКА ПРОВАЛЕНА"; exit 1; }
