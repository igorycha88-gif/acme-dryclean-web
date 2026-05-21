# ЧТЗ: Привязка домена da-dryclean.ru и SSL-сертификат

## Бизнес-задача
Прикрутить домен `da-dryclean.ru` к продакшн-сайту химчистки и настроить HTTPS с автоматическим обновлением SSL-сертификата через Let's Encrypt.

## Маршрут: АНАЛИТИК → DEVOPS (инфраструктурная задача)

## Текущее состояние
- Nginx прод-конфиг (`nginx/prod.conf`) слушает порт 80, `server_name _;`
- SSL не настроен
- Blue-Green деплой через `docker-compose.prod.yml` + `docker-compose.blue.yml` / `docker-compose.green.yml`
- DNS A-запись `da-dryclean.ru` → IP сервера уже настроена

## Требования

### 1. Домен
- `server_name da-dryclean.ru www.da-dryclean.ru;`
- Редирект `www.da-dryclean.ru` → `da-dryclean.ru` (301)

### 2. SSL (Let's Encrypt / certbot)
- Сертификат для `da-dryclean.ru` и `www.da-dryclean.ru`
- HTTP → HTTPS редирект (порт 80 → 443)
- Автообновление через certbot renew (cron или docker entrypoint)
- Путь сертификатов: `/etc/letsencrypt/live/da-dryclean.ru/`

### 3. ACME challenge
- Nginx отдаёт `/.well-known/acme-challenge/` из общего тома certbot

### 4. Docker Compose изменения
- Nginx: проброс портов 80 + 443
- Добавить сервис `certbot` (certbot/certbot)
- Добавить тома: `certbot-etc`, `certbot-var`, `webroot`
- Nginx монтирует `certbot-etc` и `webroot`

### 5. Скрипт инициализации
- `init-letsencrypt.sh` — первичное получение сертификата (с dummy-сертификатом для первого старта nginx)

## Критерии приёмки
- [ ] `curl -I https://da-dryclean.ru` → 200, сертификат валидный
- [ ] `curl -I http://da-dryclean.ru` → 301 → HTTPS
- [ ] `curl -I https://www.da-dryclean.ru` → 301 → `https://da-dryclean.ru`
- [ ] certbot контейнер запущен, сертификат автообновляется
- [ ] Blue-Green деплой продолжает работать корректно

## Файлы для изменения
- `nginx/prod.conf` — server_name, SSL, редиректы
- `docker-compose.prod.yml` — порты, certbot сервис, тома
- `init-letsencrypt.sh` — новый файл (скрипт инициализации)
- `.env.example` — добавить DOMAIN
