#!/usr/bin/env bash
# validate-env.sh — Валидация env-переменных перед деплоем
#
# Использование:
#   ./scripts/validate-env.sh              # проверка .env
#   ./scripts/validate-env.sh .env.prod    # проверка конкретного файла

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

ENV_FILE="${1:-$ROOT_DIR/.env}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "=== Проверка env-файла: $ENV_FILE ==="

if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}ERROR: Файл $ENV_FILE не найден${NC}"
    exit 1
fi

# Обязательные переменные
REQUIRED_VARS=(
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "POSTGRES_DB"
    "RABBITMQ_USER"
    "RABBITMQ_PASS"
    "VPS_USER"
    "VPS_HOST"
)

# Переменные с дефолтными значениями (предупреждение если не заданы)
OPTIONAL_VARS=(
    "POSTGRES_PORT"
    "REDIS_PORT"
    "DEPLOY_DIR"
)

# Проверяем обязательные
echo ""
echo "--- Обязательные переменные ---"
for var in "${REQUIRED_VARS[@]}"; do
    value=$(grep -E "^${var}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '[:space:]' || echo "")

    if [[ -z "$value" ]]; then
        echo -e "${RED}✗ $var — НЕ ЗАДАНА${NC}"
        ERRORS=$((ERRORS + 1))
    else
        # Маскируем значение для безопасности
        masked="${value:0:3}***${value: -2}"
        if [[ ${#value} -le 5 ]]; then
            masked="***"
        fi
        echo -e "${GREEN}✓ $var = $masked${NC}"
    fi
done

# Проверяем опциональные
echo ""
echo "--- Опциональные переменные ---"
for var in "${OPTIONAL_VARS[@]}"; do
    value=$(grep -E "^${var}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '[:space:]' || echo "")

    if [[ -z "$value" ]]; then
        echo -e "${YELLOW}⚠ $var — не задана (будет использовано значение по умолчанию)${NC}"
    else
        echo -e "${GREEN}✓ $var = $value${NC}"
    fi
done

# Проверяем безопасность паролей
echo ""
echo "--- Проверка безопасности ---"

DB_PASSWORD=$(grep -E "^POSTGRES_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '[:space:]' || echo "")
RABBIT_PASSWORD=$(grep -E "^RABBITMQ_PASS=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '[:space:]' || echo "")

if [[ "$DB_PASSWORD" == "dryclean_prod" ]] || [[ "$DB_PASSWORD" == "password" ]] || [[ "$DB_PASSWORD" == "123456" ]]; then
    echo -e "${RED}✗ POSTGRES_PASSWORD использует дефолтное/слабое значение!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ POSTGRES_PASSWORD — кастомное значение${NC}"
fi

if [[ "$RABBIT_PASSWORD" == "dryclean_prod" ]] || [[ "$RABBIT_PASSWORD" == "guest" ]]; then
    echo -e "${RED}✗ RABBITMQ_PASS использует дефолтное/слабое значение!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ RABBITMQ_PASS — кастомное значение${NC}"
fi

# Итог
echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo -e "${RED}=== ВАЛИДАЦИЯ НЕ ПРОЙДЕНА: $ERRORS ошибок ===${NC}"
    exit 1
else
    echo -e "${GREEN}=== ВАЛИДАЦИЯ ПРОЙДЕНА ===${NC}"
    exit 0
fi
