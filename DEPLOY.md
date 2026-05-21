# DEPLOY.md — Конвейер безопасного деплоя (Blue-Green)

## Архитектура

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
    │  frontend:3001    │   │  frontend:3002     │
    │  content:8011     │   │  content:8012      │
    │  postgres:5433    │   │  postgres:5434     │
    │  redis:6380       │   │  redis:6381        │
    │  rabbitmq:5673    │   │  rabbitmq:5674     │
    └───────────────────┘   └────────────────────┘
```

## Быстрый старт

### 1. Настройка GitHub Secrets

```bash
gh secret set SSH_PRIVATE_KEY    # < contents of ~/.ssh/id_ed25519
gh secret set VPS_USER           # root
gh secret set VPS_HOST           # 1.2.3.4
gh secret set POSTGRES_PASSWORD  # <your strong password>
gh secret set RABBITMQ_PASS      # <your strong password>
```

### 2. Настройка сервера

```bash
# На VPS сервере:
mkdir -p /opt/app
cd /opt/app
git clone <repo-url> .

# Создайте .env файл:
cat > .env << EOF
POSTGRES_USER=dryclean
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=dryclean_content
RABBITMQ_USER=dryclean
RABBITMQ_PASS=<strong-password>
VPS_USER=root
VPS_HOST=<your-vps-ip>
EOF

# Создайте nginx директорию:
mkdir -p /etc/nginx/conf.d
```

### 3. Первый деплой

```bash
# Из локальной репозитории:
./scripts/deploy.sh
```

Или через GitHub Actions:
```bash
gh workflow run deploy.yml
```

## Скрипты

| Скрипт | Описание |
|--------|----------|
| `scripts/version.sh` | Автоматическое определение SemVer |
| `scripts/deploy.sh` | Полный деплой с backup + health-check |
| `scripts/rollback.sh` | Откат на предыдущую версию |
| `scripts/cleanup.sh` | Удаление старых Docker образов |
| `scripts/validate-env.sh` | Проверка env-переменных |
| `scripts/version-registry.sh` | Реестр версий |

## Версионирование

### Автоматическое (по коммитам)

| Коммит | Версия |
|--------|--------|
| `fix: bug` | 1.2.3 → 1.2.4 |
| `feat: feature` | 1.2.3 → 1.3.0 |
| `feat!: breaking` | 1.2.3 → 2.0.0 |

### Ручное

```bash
./scripts/version.sh --set 2.0.0
./scripts/deploy.sh --version 2.0.0
```

## Деплой

### Автоматический (GitHub Actions)

```bash
gh workflow run deploy.yml
gh workflow run deploy.yml --field version=1.5.0
```

### Ручной (с сервера)

```bash
cd /opt/app
./scripts/deploy.sh
./scripts/deploy.sh --version 1.5.0
```

## Rollback

```bash
# Откат на предыдущую версию
./scripts/rollback.sh

# Откат на конкретную версию
./scripts/rollback.sh v1.2.3
```

## Проверка статуса

```bash
# Текущее активное окружение
cat current_env

# Лог версий
cat VERSIONS.md

# Docker контейнеры
docker compose -f docker-compose.blue.yml ps
docker compose -f docker-compose.green.yml ps

# Активное окружение через nginx
curl http://localhost/active-env
```

## Очистка

```bash
# Удалить старые образы (хранить 5)
./scripts/cleanup.sh

# Хранить только 3 версии
./scripts/cleanup.sh --keep 3
```

## Troubleshooting

### Health-check не проходит

```bash
# Логи standby окружения
docker compose -f docker-compose.green.yml logs --tail=100

# Проверка конкретного сервиса
docker inspect --format='{{.State.Health.Status}}' content-green
```

### Nginx не переключил трафик

```bash
# Проверить active.conf
cat /etc/nginx/conf.d/active.conf

# Переключить вручную
echo 'set $active_env "green";' > /etc/nginx/conf.d/active.conf
nginx -s reload
```

### Нехватка RAM

```bash
# Остановить standby перед деплоем
docker compose -f docker-compose.green.yml down

# Или увеличить cleanup
./scripts/cleanup.sh --keep 2
```
