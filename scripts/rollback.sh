#!/usr/bin/env bash
# rollback.sh — Откат на предыдущую версию
#
# Использование:
#   ./scripts/rollback.sh              # откат на предыдущую версию
#   ./scripts/rollback.sh v1.2.3       # откат на конкретную версию

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_VERSION=""
ROLLBACK_START=$(date +%s)

log() { echo -e "${BLUE}[ROLLBACK]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# Определяем целевую версию
# ============================================================
if [[ -n "${1:-}" ]]; then
    TARGET_VERSION="${1#v}"
    log "Откат на версию: v${TARGET_VERSION}"
else
    # Берём предыдущую версию из VERSIONS.md
    if [[ -f "$ROOT_DIR/VERSIONS.md" ]]; then
        TARGET_VERSION=$(grep "DEPLOYED" "$ROOT_DIR/VERSIONS.md" | tail -2 | head -1 | cut -d'|' -f2 | tr -d '[:space:]' | sed 's/v//')
    fi

    if [[ -z "$TARGET_VERSION" ]]; then
        error "Не удалось определить предыдущую версию"
        error "Укажите версию явно: ./scripts/rollback.sh v1.2.3"
        exit 1
    fi

    log "Откат на предыдущую версию: v${TARGET_VERSION}"
fi

# ============================================================
# Определяем current standby (куда будем откатывать)
# ============================================================
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

log "Текущий active: $ACTIVE_ENV, откатываем на: $STANDBY_ENV"

# ============================================================
# Проверяем backup БД для этой версии
# ============================================================
log "=== Поиск backup БД для v${TARGET_VERSION} ==="

BACKUP_FILE=$(ls "$ROOT_DIR/backups/"*"${TARGET_VERSION}"*.sql 2>/dev/null | tail -1 || echo "")

if [[ -n "$BACKUP_FILE" ]]; then
    success "Backup найден: $BACKUP_FILE"

    # Спрашиваем подтверждение на восстановление БД
    echo -n "Восстановить БД из backup? (y/N): "
    read -r RESTORE_DB || RESTORE_DB="n"

    if [[ "$RESTORE_DB" == "y" ]] || [[ "$RESTORE_DB" == "Y" ]]; then
        log "Восстановление БД..."

        if [[ "$STANDBY_ENV" == "blue" ]]; then
            PG_CONTAINER="postgres-blue"
            PG_COMPOSE="docker-compose.blue.yml"
        else
            PG_CONTAINER="postgres-green"
            PG_COMPOSE="docker-compose.green.yml"
        fi

        docker compose -f "$PG_COMPOSE" exec -T "$PG_CONTAINER" psql -U "${POSTGRES_USER:-dryclean}" "${POSTGRES_DB:-dryclean_content}" < "$BACKUP_FILE"
        success "БД восстановлена из backup"
    else
        warn "Пропускаем восстановление БД"
    fi
else
    warn "Backup для v${TARGET_VERSION} не найден"
    warn "Данные БД не будут восстановлены"
fi

# ============================================================
# Переключаем трафик обратно на standby
# ============================================================
log "=== Переключение трафика на $STANDBY_ENV ==="

NGINX_ACTIVE_CONF="/etc/nginx/conf.d/active.conf"
echo "set \$active_env \"$STANDBY_ENV\";" > "$NGINX_ACTIVE_CONF" 2>/dev/null || {
    warn "Не удалось записать $NGINX_ACTIVE_CONF"
    warn "Выполните вручную: echo 'set \$active_env \"$STANDBY_ENV\";' > $NGINX_ACTIVE_CONF && nginx -s reload"
}

nginx -s reload 2>/dev/null || docker exec nginx nginx -s reload 2>/dev/null || {
    warn "Nginx reload не удался"
}

# Обновляем active
echo "$STANDBY_ENV" > "$CURRENT_ENV_FILE"

success "Трафик переключён на $STANDBY_ENV"

# ============================================================
# Обновляем VERSIONS.md
# ============================================================
if [[ -f "$ROOT_DIR/VERSIONS.md" ]]; then
    echo "| v${TARGET_VERSION} | $(date -u +%Y-%m-%d) | ${STANDBY_ENV} | rollback | ROLLED_BACK |" >> "$ROOT_DIR/VERSIONS.md"
fi

# ============================================================
# ИТОГ
# ============================================================
ROLLBACK_END=$(date +%s)
ROLLBACK_TIME=$((ROLLBACK_END - ROLLBACK_START))

echo ""
echo "============================================================"
echo -e "${GREEN}=== ОТКАТ ЗАВЕРШЁН ===${NC}"
echo "============================================================"
echo "  Версия:      v${TARGET_VERSION}"
echo "  Окружение:   ${STANDBY_ENV} (теперь active)"
echo "  Время:       ${ROLLBACK_TIME}s"
echo ""
echo "  Для повторного деплоя: ./scripts/deploy.sh"
echo "============================================================"
