#!/usr/bin/env bash
# cleanup.sh — Очистка старых Docker образов
#
# Хранит последние 5 версий, удаляет всё остальное
#
# Использование:
#   ./scripts/cleanup.sh              # cleanup с дефолтом (5 версий)
#   ./scripts/cleanup.sh --keep 3     # хранить 3 версии

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

KEEP_COUNT=5

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep) KEEP_COUNT="$2"; shift 2 ;;
        --help)
            echo "Usage: $0 [--keep N]"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

log() { echo -e "${BLUE}[CLEANUP]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

log "=== Очистка старых образов (хранить: $KEEP_COUNT) ==="

# Получаем список образов dryclean/*
IMAGES=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep '^dryclean/' | sort || echo "")

if [[ -z "$IMAGES" ]]; then
    success "Нет образов для очистки"
    exit 0
fi

log "Найдено образов: $(echo "$IMAGES" | wc -l)"

# Собираем уникальные версии (исключая latest, blue, green)
VERSIONS=$(echo "$IMAGES" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V -r | uniq || echo "")

if [[ -z "$VERSIONS" ]]; then
    warn "Нет версионированных образов для очистки"
    exit 0
fi

TOTAL_VERSIONS=$(echo "$VERSIONS" | wc -l)
log "Уникальных версий: $TOTAL_VERSIONS"

if [[ "$TOTAL_VERSIONS" -le "$KEEP_COUNT" ]]; then
    success "Версий ($TOTAL_VERSIONS) <= лимита ($KEEP_COUNT). Очистка не нужна."
    exit 0
fi

# Определяем версии для удаления
VERSIONS_TO_DELETE=$(echo "$VERSIONS" | tail -n +$((KEEP_COUNT + 1)))

log "Версии для удаления:"
echo "$VERSIONS_TO_DELETE" | while read -r ver; do
    echo "  - $ver"
done

# Удаляем образы
echo "$VERSIONS_TO_DELETE" | while read -r ver; do
    for service in frontend content; do
        IMAGE="dryclean/${service}:${ver}"
        if docker image inspect "$IMAGE" > /dev/null 2>&1; then
            docker rmi "$IMAGE" 2>/dev/null || true
            log "Удалён: $IMAGE"
        fi
    done
done

# Чистим dangling образы
docker image prune -f > /dev/null 2>&1

success "Очистка завершена"

# Показываем оставшиеся образы
echo ""
log "Оставшиеся образы:"
docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | grep 'dryclean/' || echo "  (нет)"
