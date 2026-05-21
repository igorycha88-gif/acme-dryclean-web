#!/usr/bin/env bash
# version-registry.sh — Реестр версий (VERSIONS.md + git tag)
#
# Использование:
#   ./scripts/version-registry.sh v1.2.4    # зарегистрировать версию
#   ./scripts/version-registry.sh --list     # показать все версии

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

VERSIONS_FILE="$ROOT_DIR/VERSIONS.md"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[REGISTRY]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

# --list: показать все версии
if [[ "${1:-}" == "--list" ]]; then
    if [[ -f "$VERSIONS_FILE" ]]; then
        cat "$VERSIONS_FILE"
    else
        echo "VERSIONS.md не найден"
    fi
    exit 0
fi

# Регистрация версии
VERSION="${1#v}"

if [[ -z "$VERSION" ]]; then
    echo "Usage: $0 <version> | --list"
    exit 1
fi

# Создаём VERSIONS.md если нет
if [[ ! -f "$VERSIONS_FILE" ]]; then
    cat > "$VERSIONS_FILE" << 'EOF'
# VERSIONS — Лог деплоев

| Version | Date | Env | Author | Status |
|---------|------|-----|--------|--------|
EOF
fi

# Git tag
git tag -a "v${VERSION}" -m "Deploy v${VERSION} on $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>/dev/null || {
    echo "Git tag v${VERSION} уже существует или ошибка"
}

# Запись в VERSIONS.md
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null | head -1 || echo "N/A")
git_user=$(git config user.name 2>/dev/null || echo "unknown")
current_env=$(cat "$ROOT_DIR/current_env" 2>/dev/null || echo "unknown")

echo "| v${VERSION} | $(date -u +%Y-%m-%d) | ${current_env} | ${git_user} | DEPLOYED |" >> "$VERSIONS_FILE"

success "Версия v${VERSION} зарегистрирована"
