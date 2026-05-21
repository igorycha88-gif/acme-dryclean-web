#!/usr/bin/env bash
# version.sh — Автоматическое определение SemVer по коммитам
#
# Использование:
#   ./scripts/version.sh              # авто-версия по коммитам
#   ./scripts/version.sh --major      # принудительно MAJOR+1
#   ./scripts/version.sh --minor      # принудительно MINOR+1
#   ./scripts/version.sh --patch      # принудительно PATCH+1
#   ./scripts/version.sh --set 1.5.0  # установить конкретную версию
#
# Выводит версию в stdout: 1.2.4

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION_FILE="$ROOT_DIR/VERSION"

# Читаем текущую версию из файла или начинаем с 0.0.1
if [[ -f "$VERSION_FILE" ]]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')
else
    CURRENT_VERSION="0.0.1"
fi

MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

# Определяем тип изменения по коммитам
detect_version_bump() {
    local since_tag=""

    # Ищем последний тег
    local last_tag
    last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

    if [[ -n "$last_tag" ]]; then
        since_tag="$last_tag"
    else
        # Если нет тегов, смотрим все коммиты
        since_tag=""
    fi

    local commits
    if [[ -n "$since_tag" ]]; then
        commits=$(git log "${since_tag}..HEAD" --oneline --no-merges 2>/dev/null || echo "")
    else
        commits=$(git log --oneline --no-merges 2>/dev/null || echo "")
    fi

    if [[ -z "$commits" ]]; then
        echo "patch"
        return
    fi

    # Проверяем на breaking changes
    if echo "$commits" | grep -qiE '(feat!|fix!|refactor!|BREAKING CHANGE)'; then
        echo "major"
        return
    fi

    # Проверяем на новые фичи
    if echo "$commits" | grep -qiE '^.*feat(\(.+\))?:'; then
        echo "minor"
        return
    fi

    # По умолчанию — patch
    echo "patch"
}

# Парсим аргументы
BUMP_TYPE=""
SET_VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --major) BUMP_TYPE="major"; shift ;;
        --minor) BUMP_TYPE="minor"; shift ;;
        --patch) BUMP_TYPE="patch"; shift ;;
        --set) SET_VERSION="$2"; shift 2 ;;
        --help)
            echo "Usage: $0 [--major|--minor|--patch|--set X.Y.Z]"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Устанавливаем конкретную версию
if [[ -n "$SET_VERSION" ]]; then
    echo "$SET_VERSION" | tee "$VERSION_FILE"
    exit 0
fi

# Определяем тип изменения
if [[ -z "$BUMP_TYPE" ]]; then
    BUMP_TYPE=$(detect_version_bump)
fi

# Рассчитываем новую версию
case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

# Сохраняем и выводим
echo "$NEW_VERSION" | tee "$VERSION_FILE"
