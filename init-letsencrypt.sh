#!/bin/bash

set -e

DOMAIN="da-dryclean.ru"
EMAIL="${CERTBOT_EMAIL:-admin@da-dryclean.ru}"
COMPOSE_FILE="docker-compose.prod.yml"
STAGING="${STAGING:-0}"

if ! command -v docker &> /dev/null; then
    echo "ERROR: docker не установлен"
    exit 1
fi

echo "=== Инициализация Let's Encrypt для ${DOMAIN} ==="

echo "[1/5] Создание docker-сетей и томов..."
docker compose -f ${COMPOSE_FILE} up --no-start 2>/dev/null || true

echo "[2/5] Создание dummy-сертификата (для первого старта nginx)..."
docker compose -f ${COMPOSE_FILE} run --rm --entrypoint "\
  /bin/sh -c '\
  mkdir -p /etc/letsencrypt/live/${DOMAIN} && \
  openssl req -x509 -nodes -newkey rsa:4096 \
    -days 1 \
    -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
    -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
    -subj \"/CN=${DOMAIN}\"'" certbot

echo "[3/5] Запуск nginx с dummy-сертификатом..."
docker compose -f ${COMPOSE_FILE} up -d nginx
sleep 5

echo "[4/5] Удаление dummy-сертификата..."
docker compose -f ${COMPOSE_FILE} run --rm --entrypoint "\
  /bin/sh -c '\
  rm -rf /etc/letsencrypt/live/${DOMAIN} && \
  rm -rf /etc/letsencrypt/renewal/${DOMAIN}.conf && \
  rm -rf /etc/letsencrypt/archive/${DOMAIN}'" certbot

echo "[5/5] Получение настоящего сертификата..."
STAGING_FLAG=""
if [ "${STAGING}" = "1" ]; then
    STAGING_FLAG="--staging"
    echo "   (staging режим — тестовый сертификат)"
fi

docker compose -f ${COMPOSE_FILE} run --rm --entrypoint "\
  certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    ${STAGING_FLAG} \
    -d ${DOMAIN} \
    -d www.${DOMAIN}" certbot

echo "[extra] Перезапуск nginx с настоящим сертификатом..."
docker compose -f ${COMPOSE_FILE} restart nginx

echo ""
echo "=== Готово! ==="
echo "Сертификат установлен для: ${DOMAIN}, www.${DOMAIN}"
echo "Автообновление: certbot контейнер проверяет каждые 12 часов"
echo ""
echo "Для запуска всех сервисов:"
echo "  docker compose -f ${COMPOSE_FILE} up -d"
