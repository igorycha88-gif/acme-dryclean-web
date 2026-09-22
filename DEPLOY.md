# DEPLOY.md — CI/CD Blue-Green Deployment

## Architecture

```
GitHub Actions (deploy.yml)
        │
        ├── CI (lint + typecheck)
        ├── Calculate version
        │
        └── SSH → VPS (/opt/app)
              │
              ├── 1. Git pull (origin/main)
              ├── 2. Determine active/standby
              ├── 3. DB backup
              ├── 4. Build standby (--no-cache)
              ├── 5. Start standby (--force-recreate)
              ├── 6. Health-check (120s timeout)
              ├── 7. Smoke tests
              ├── 8. Switch nginx traffic
              ├── 9. Verify live traffic
              ├── 10. Update version tracking
              └── 11. Cleanup old images

              ┌─ On failure: AUTO-ROLLBACK ─┐
              │  Switch nginx back to active  │
              │  Stop failed standby          │
              └───────────────────────────────┘
```

## Blue-Green Architecture

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  :80/:443   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼─────────┐   ┌──────────▼─────────┐
    │   BLUE (active)   │   │  GREEN (standby)   │
    │  frontend:3000    │   │  frontend:3000     │
    │  content:8011     │   │  content:8011      │
    │  postgres         │   │  postgres          │
    │  redis            │   │  redis             │
    │  rabbitmq         │   │  rabbitmq          │
    └───────────────────┘   └────────────────────┘

    Nginx reads: /etc/nginx/conf.d/active.conf
    Contains:    set $active_env "blue";  (or "green")
```

## Workflows

### CI (`ci.yml`) — Automatic on push/PR to main

Runs lint, typecheck, and build verification. No deployment.

### Deploy (`deploy.yml`) — Manual trigger from main

```bash
# Deploy with auto-version
gh workflow run deploy.yml

# Deploy with specific version
gh workflow run deploy.yml --field version=1.5.0

# Deploy skipping CI
gh workflow run deploy.yml --field skip_tests=true

# Deploy without auto-rollback
gh workflow run deploy.yml --field auto_rollback=false
```

## Pipeline Steps

| Step | Description | Timeout |
|------|-------------|---------|
| CI check | ruff + mypy + eslint + tsc | 10 min |
| Calculate version | SemVer from commits | 1 min |
| Pre-deploy snapshot | Current state capture | 1 min |
| Sync code | git pull on VPS | 2 min |
| Determine envs | active vs standby | instant |
| DB backup | pg_dump active | 2 min |
| Build standby | docker compose build --no-cache | 10 min |
| Start standby | docker compose up --force-recreate | 2 min |
| Health-check | Poll until healthy | up to 120s |
| Smoke tests | /health endpoint checks | 30s |
| Switch traffic | nginx active.conf + reload | instant |
| Verify live | HTTPS + nginx-health checks | 10s |
| Version tracking | current_env + VERSIONS.md + git tag | instant |
| Cleanup | Remove old images (keep 3) | 1 min |
| **Auto-rollback** | On any failure | instant |

## GitHub Secrets Required

```bash
gh secret set SSH_PRIVATE_KEY    # SSH private key for VPS
gh secret set VPS_USER           # root
gh secret set VPS_HOST           # VPS IP address
gh secret set POSTGRES_PASSWORD  # Strong DB password
gh secret set RABBITMQ_PASS      # Strong RabbitMQ password
```

## First-time VPS Setup

```bash
ssh root@VPS_HOST

mkdir -p /opt/app
cd /opt/app
git clone <repo-url> .

cat > .env << EOF
POSTGRES_USER=dryclean
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=dryclean_content
RABBITMQ_USER=dryclean
RABBITMQ_PASS=<strong-password>
EOF

mkdir -p /etc/nginx/conf.d
echo 'set $active_env "blue";' > /etc/nginx/conf.d/active.conf

# Initial deploy of blue environment
docker compose -f docker-compose.blue.yml build --no-cache
docker compose -f docker-compose.blue.yml up -d

# Wait for healthy
# Then deploy nginx container
docker compose -f docker-compose.prod.yml up -d nginx certbot
```

## Rollback

```bash
# Automatic — CI/CD does it on failure (auto_rollback=true by default)

# Manual via CLI
./scripts/rollback.sh

# Manual via CI/CD — switch back to previous active
gh workflow run deploy.yml --field skip_tests=true
```

## Monitoring

```bash
# Active environment
cat /opt/app/current_env

# Nginx routing
cat /etc/nginx/conf.d/active.conf

# All containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Deploy history
cat /opt/app/VERSIONS.md

# Check which env is live
curl -s https://da-dryclean.ru/active-env
```

## Troubleshooting

### ⚠️ Известное ограничение: embedded DNS Docker не работает (ядро VPS)

Кастомное ядро VPS `5.2.0 #1 SMP` не поддерживает iptables-nat ни в одном режиме
(`CHAIN_ADD failed`, `modprobe nf_nat → Module not found`). Из-за этого embedded
DNS Docker (`127.0.0.11:53`) не работает: **контейнеры не могут обращаться друг к
другу по имени**. Полный разбор: `требования/ЧТЗ_Фикс_Docker_DNS_VPS.md`.

**Воркараунд (применён, обязателен до обновления ядра):**

- Сеть `dryclean-net` создаётся с фиксированной подсетью `172.22.0.0/16`.
- Статические IP: `postgres 172.22.0.3`, `content 172.22.0.2`,
  `tracking 172.22.0.4`, `postgres-exporter 172.22.0.5`, `frontend 172.22.0.10`.
- `extra_hosts` в compose-файлах резолвит `postgres` → `172.22.0.3`.
- Blue/green-окружения используют свои подсети: blue `172.26.0.0/16`,
  green `172.27.0.0/16` — там тоже только IP, без имён.

**ЗАПРЕЩЕНО до обновления ядра:** запускать новые контейнеры, которые ходят в
postgres/redis/rabbitmq **по имени сервиса**. Только статические IP или
`extra_hosts`. Перезапуск `dryclean-postgres`/`tracking`/`content` — только
через `scripts/deploy-vps.sh` (он проставляет IP).

**Постоянное решение (TASK-DNS-3):** обновление ядра VPS —
`scripts/fix-vps-kernel.sh` (диагностика → `--install` → reboot → `--verify`).
Если ядро управляется хостером и не обновляется — ограничение фиксируется
документацией (этот раздел), воркараунд остаётся постоянно.

### Применение фикса DNS на VPS (одноразово, окно обслуживания)

Чтобы postgres навсегда закрепил 172.22.0.3 (сейчас IP динамический — после
ребута VPS exporter может отваливаться), один раз пересоздайте стек:

```bash
ssh root@37.143.15.148
cd /opt/app && git pull

# 1. Остановить blue-стек (дауннтайм ~2-4 мин, БД и volume сохраняются)
docker stop dryclean-frontend dryclean-content dryclean-tracking

# 2. Полный редеплой: deploy-vps.sh увидит blue unhealthy →
#    пересоздаст сеть с подсетью 172.22.0.0/16 и все контейнеры со статическими IP
bash scripts/deploy-vps.sh

# 3. Пересоздать exporter на статическом IP 172.22.0.5 (extra_hosts по факту)
bash scripts/setup-metrics-export.sh --key "$(grep ^MONITORING_API_KEY= .env | cut -d= -f2-)"

# 4. Регресс-проверка (FAIL=0 обязательно)
bash scripts/check-dns.sh
```

После этого рестарт docker/VPS не ломает связность: все контейнеры имеют
`--restart unless-stopped` + фиксированные IP.

### Регресс-проверка DNS/метрик БД (после каждого деплоя)

```bash
cd /opt/app && git pull
./scripts/check-dns.sh          # сеть, статические IP, extra_hosts, pg_up, /metrics/postgres
# после обновления ядра:
./scripts/check-dns.sh --strict # embedded DNS обязателен
```

Чек-лист после любого инфраструктурного изменения (рестарт docker, правки
сети, деплой):

```bash
docker run --rm --network dryclean-net busybox nslookup dryclean-postgres   # информативно (до фикса ядра — FAIL, это норма)
./scripts/check-dns.sh                                                     # FAIL=0 обязательно
curl -s -H "X-Monitoring-Key: $KEY" https://da-dryclean.ru/metrics/postgres | grep '^pg_up 1'
```

### Health-check not passing

```bash
docker compose -f docker-compose.green.yml logs --tail=100
docker inspect --format='{{.State.Health.Status}}' content-green
```

### Nginx not routing correctly

```bash
cat /etc/nginx/conf.d/active.conf
nginx -T 2>/dev/null | grep active_env
```

### Manual traffic switch

```bash
echo 'set $active_env "green";' > /etc/nginx/conf.d/active.conf
nginx -s reload
```

### Out of disk space

```bash
cd /opt/app && ./scripts/cleanup.sh --keep 2
docker system prune -f
```

## SMTP relay (отправка заявок с сайта)

Контейнеры на VPS не имеют outbound (ядро без nf_nat, см. раздел выше): SMTP-заявки
из frontend-контейнера ходят через nginx stream-ретранслятор на шлюзе моста:

```
frontend-контейнер ──TLS+AUTH──▶ 172.22.0.1:465 (host nginx stream)
                                     ──TCP passthrough──▶ smtp.yandex.ru:465
```

- Конфиг: `/etc/nginx/smtp-stream.conf` (копия `nginx/smtp-stream.conf` в repo, инструкция установки внутри)
- Env на VPS (`/opt/app/.env`): `SMTP_HOST=172.22.0.1`, `SMTP_TLS_SERVERNAME=smtp.yandex.ru`,
  `SMTP_USER`/`SMTP_PASS` (пароль приложения Яндекса), `SMTP_TO`
- `SMTP_TLS_SERVERNAME` — SNI/валидация сертификата Яндекса при подключении по IP
- Проверка: `ss -tlnp | grep 172.22.0.1:465` и POST валидной заявки → `{"ok":true,"channel":"email"}`

## Metrics export for external monitoring

Central monitoring (project «Мониторинг сайтов») scrapes business and service
metrics over HTTPS only, authenticated by the `X-Monitoring-Key` header.
No new ports are exposed: everything goes through nginx :443.

```
GET https://da-dryclean.ru/metrics/tracking   → 127.0.0.1:8020  (business gauges)
GET https://da-dryclean.ru/metrics/content    → $content_upstream (blue-green aware)
GET https://da-dryclean.ru/metrics/node       → 127.0.0.1:9100  (node_exporter)
GET https://da-dryclean.ru/metrics/postgres   → 127.0.0.1:9187  (postgres_exporter)
```

### One-time setup on the VPS

```bash
ssh root@37.143.15.148
cd /opt/app && git pull
./scripts/setup-metrics-export.sh --key <MONITORING_API_KEY>
```

The script (idempotent):
- writes `/etc/nginx/conf.d/monitoring-key.conf` (map + rate limit zone, chmod 600 root:root)
- ensures the 4 `/metrics/*` locations exist in `/etc/nginx/nginx.conf`, runs `nginx -t`, reloads
- stores `MONITORING_API_KEY` in `/opt/app/.env` (600)
- installs node_exporter as a systemd service bound to 127.0.0.1:9100
- creates read-only user `metrics_exporter` (pg_monitor) and starts
  `dryclean-postgres-exporter` container on 127.0.0.1:9187
- runs acceptance checks (403 without key, 200 + expected metric names with key, POST → 405)

The monitoring key and `POSTGRES_EXPORTER_PASSWORD` must never be committed.
`/metrics/content` follows the active blue-green environment automatically
(existing `map $active_env $content_upstream`).
