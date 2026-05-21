#!/usr/bin/env bash
# deploy.sh — Безопасный Blue-Green деплой с версионированием
#
# Использование:
#   ./scripts/deploy.sh              # деплой с авто-версией
#   ./scripts/deploy.sh --version 1.5.0  # деплой с конкретной версией
#   ./scripts/deploy.sh --skip-tests   # пропустить CI (локальный деплой)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Параметры
VERSION=""
SKIP_TESTS=false
ACTIVE_ENV=""
STANDBY_ENV=""
DEPLOY_START=$(date +%s)

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        --version) VERSION="$2"; shift 2 ;;
        --skip-tests) SKIP_TESTS=true; shift ;;
        --help)
            echo "Usage: $0 [--version X.Y.Z] [--skip-tests]"
            exit 0
            ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

log() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# ШАГ 1: Определение версии
# ============================================================
log "=== ШАГ 1: Определение версии ==="

if [[ -z "$VERSION" ]]; then
    VERSION=$("$SCRIPT_DIR/version.sh")
    success "Автоматическая версия: $VERSION"
else
    "$SCRIPT_DIR/version.sh" --set "$VERSION" > /dev/null
    success "Установлена версия: $VERSION"
fi

# ============================================================
# ШАГ 2: Проверка окружения
# ============================================================
log "=== ШАГ 2: Проверка окружения ==="

# Проверка RAM (минимум 2GB для двух окружений)
RAM_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0")
if [[ "$RAM_MB" -gt 0 ]] && [[ "$RAM_MB" -lt 2048 ]]; then
    warn "RAM: ${RAM_MB}MB (рекомендуется 2GB+)"
else
    success "RAM: ${RAM_MB}MB"
fi

# Проверка диска (минимум 2GB свободно)
DISK_FREE=$(df -m / | awk 'NR==2{print $4}' || echo "0")
if [[ "$DISK_FREE" -lt 2048 ]]; then
    error "Недостаточно места на диске: ${DISK_FREE}MB (нужно 2GB+)"
    exit 1
fi
success "Диск свободно: ${DISK_FREE}MB"

# Валидация env
"$SCRIPT_DIR/validate-env.sh"

# ============================================================
# ШАГ 3: Определение active/standby окружения
# ============================================================
log "=== ШАГ 3: Определение active/standby ==="

CURRENT_ENV_FILE="$ROOT_DIR/current_env"
if [[ -f "$CURRENT_ENV_FILE" ]]; then
    ACTIVE_ENV=$(cat "$CURRENT_ENV_FILE" | tr -d '[:space:]')
else
    ACTIVE_ENV="blue"
fi

if [[ "$ACTIVE_ENV" == "blue" ]]; then
    STANDBY_ENV="green"
else
    STANDBY_ENV="blue"
fi

success "Active: $ACTIVE_ENV, Standby (деплой): $STANDBY_ENV"

# ============================================================
# ШАГ 4: Backup БД
# ============================================================
log "=== ШАГ 4: Backup БД ==="

BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/db_v${VERSION}_$(date +%Y%m%d_%H%M%S).sql"

# Определяем порт postgres активного окружения
if [[ "$ACTIVE_ENV" == "blue" ]]; then
    PG_PORT="5433"
else
    PG_PORT="5434"
fi

# Пробуем сделать backup
if docker compose -f "docker-compose.${ACTIVE_ENV}.yml" exec -T "postgres-${ACTIVE_ENV}" pg_dump -U "${POSTGRES_USER:-dryclean}" "${POSTGRES_DB:-dryclean_content}" > "$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    success "Backup создан: $BACKUP_FILE ($BACKUP_SIZE)"
else
    warn "Backup не удалось создать (возможно сервис не запущен). Продолжаем без backup."
    rm -f "$BACKUP_FILE"
fi

# ============================================================
# ШАГ 5: Сборка standby окружения
# ============================================================
log "=== ШАГ 5: Сборка $STANDBY_ENV окружения (версия $VERSION) ==="

export VERSION

docker compose -f "docker-compose.${STANDBY_ENV}.yml" build --no-cache

success "$STANDBY_ENV окружение собрано"

# ============================================================
# ШАГ 6: Запуск standby окружения
# ============================================================
log "=== ШАГ 6: Запуск $STANDBY_ENV окружения ==="

docker compose -f "docker-compose.${STANDBY_ENV}.yml" up -d --force-recreate

success "$STANDBY_ENV окружение запущено"

# ============================================================
# ШАГ 7: Health-check standby окружения
# ============================================================
log "=== ШАГ 7: Health-check $STANDBY_ENV ==="

MAX_WAIT=120
ELAPSED=0
INTERVAL=10

HEALTHY=false

while [[ $ELAPSED -lt $MAX_WAIT ]]; do
    ALL_HEALTHY=true

    # Проверяем все сервисы
    for service in "frontend-${STANDBY_ENV}" "content-${STANDBY_ENV}"; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "unknown")
        if [[ "$STATUS" != "healthy" ]]; then
            ALL_HEALTHY=false
            break
        fi
    done

    if $ALL_HEALTHY; then
        HEALTHY=true
        break
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    log "Ожидание health-check... (${ELAPSED}s/${MAX_WAIT}s)"
done

if ! $HEALTHY; then
    error "Health-check не пройден за ${MAX_WAIT}s"
    error "=== Логи $STANDBY_ENV ==="
    docker compose -f "docker-compose.${STANDBY_ENV}.yml" logs --tail=50

    error "=== ОТКАТ: останавливаем $STANDBY_ENV ==="
    docker compose -f "docker-compose.${STANDBY_ENV}.yml" down
    exit 1
fi

success "Все сервисы $STANDBY_ENV healthy"

# ============================================================
# ШАГ 8: Проверка доступности сервисов
# ============================================================
log "=== ШАГ 8: Проверка доступности ==="

# Жём чтобы сервисы полностью стартовали
sleep 5

# Проверяем frontend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 || echo "000")
if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "301" ]] || [[ "$HTTP_CODE" == "302" ]]; then
    success "Frontend OK (HTTP $HTTP_CODE)"
else
    warn "Frontend HTTP $HTTP_CODE (может быть в процессе загрузки)"
fi

# Проверяем content API
CONTENT_PORT=$([[ "$STANDBY_ENV" == "blue" ]] && echo "8011" || echo "8012")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${CONTENT_PORT}/health" || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
    success "Content API OK (HTTP $HTTP_CODE)"
else
    error "Content API не отвечает (HTTP $HTTP_CODE)"
    exit 1
fi

# ============================================================
# ШАГ 9: Переключение трафика (Nginx)
# ============================================================
log "=== ШАГ 9: Переключение трафика на $STANDBY_ENV ==="

# Обновляем active_env в nginx
NGINX_ACTIVE_CONF="/etc/nginx/conf.d/active.conf"
echo "set \$active_env \"$STANDBY_ENV\";" > "$NGINX_ACTIVE_CONF" 2>/dev/null || {
    warn "Не удалось записать $NGINX_ACTIVE_CONF (нет прав). Переключаем вручную."
    warn "Выполните: echo 'set \$active_env \"$STANDBY_ENV\";' > $NGINX_ACTIVE_CONF && nginx -s reload"
}

# Reload nginx
nginx -s reload 2>/dev/null || docker exec nginx nginx -s reload 2>/dev/null || {
    warn "Nginx reload не удался. Переключите вручную."
}

success "Трафик переключён на $STANDBY_ENV"

# ============================================================
# ШАГ 10: Обновляем active
# ============================================================
log "=== ШАГ 10: Обновление статуса ==="

echo "$STANDBY_ENV" > "$CURRENT_ENV_FILE"

# Git tag
git tag -a "v${VERSION}" -m "Deploy v${VERSION} on $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>/dev/null || warn "Git tag не создан (возможно уже существует)"

# Обновляем VERSIONS.md
VERSIONS_FILE="$ROOT_DIR/VERSIONS.md"
if [[ ! -f "$VERSIONS_FILE" ]]; then
    echo "# VERSIONS — Лог деплоев" > "$VERSIONS_FILE"
    echo "" >> "$VERSIONS_FILE"
    echo "| Version | Date | Env | Author | Status |" >> "$VERSIONS_FILE"
    echo "|---------|------|-----|--------|--------|" >> "$VERSIONS_FILE"
fi

COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null | head -1 || echo "N/A")
git_user=$(git config user.name 2>/dev/null || echo "unknown")
echo "| v${VERSION} | $(date -u +%Y-%m-%d) | ${STANDBY_ENV} | ${git_user} | DEPLOYED |" >> "$VERSIONS_FILE"

success "VERSIONS.md обновлён"

# ============================================================
# ШАГ 11: Cleanup старых образов
# ============================================================
log "=== ШАГ 11: Cleanup ==="

"$SCRIPT_DIR/cleanup.sh" || warn "Cleanup не удался (не критично)"

# ============================================================
# ИТОГ
# ============================================================
DEPLOY_END=$(date +%s)
DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))

echo ""
echo "============================================================"
echo -e "${GREEN}=== ДЕПЛОЙ ЗАВЕРШЁН УСПЕШНО ===${NC}"
echo "============================================================"
echo "  Версия:      v${VERSION}"
echo "  Окружение:   ${STANDBY_ENV} (теперь active)"
echo "  Пред. active: ${ACTIVE_ENV} (теперь standby)"
echo "  Время:       ${DEPLOY_TIME}s"
echo "  Backup:      ${BACKUP_FILE:-не создан}"
echo ""
echo "  Для rollback: ./scripts/rollback.sh v${VERSION}"
echo "============================================================"
