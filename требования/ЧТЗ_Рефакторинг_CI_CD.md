# ЧТЗ: Рефакторинг CI/CD — переход на GHCR + Blue-Green по паттерну Fences of the curtain

## 1. Контекст

Текущий CI/CD (7 из 7 деплоев провалены) собирает Docker-образы **на VPS** через SSH-heredoc. Это вызывает:
- OOM при `npm ci` (4GB RAM на VPS)
- DNS-ошибки при `apt-get update` (python:3.12-slim → trixie)
- Отсутствие `.git` на VPS → `git reset --hard` падает
- Нет быстрого роулбэка (нужна пересборка)

Решение: перенести сборку в GitHub Actions, пушить образы в GHCR, на VPS — только `docker pull` + `docker run` (как в проекте Fences of the curtain).

## 2. Задачи

### TASK-INFRA-001: Переработать `.github/workflows/ci.yml` (reusable)
- `workflow_call` с входными параметрами
- Job `quality`: Backend ruff + mypy, Frontend eslint + tsc
- Job `build-frontend`: `npm run build` + проверка `.next/standalone`
- Job `build-backend`: проверка что Dockerfile собирается

### TASK-INFRA-002: Переработать `.github/workflows/deploy.yml`
- CI через reusable `ci.yml`
- Job `docker`: Build + push обоих образов (frontend, content) в GHCR
  - Теги: `sha-XXXXXXX`, `latest`, `YYYYMMDD`
- Job `deploy`: SSH через `appleboy/ssh-action`
  - Вызов `scripts/deploy-vps.sh` на VPS
  - Smoke tests (5 endpoints)
  - Telegram уведомления (success/failure)
- `concurrency: deploy-production`
- `environment: production`

### TASK-INFRA-003: Создать `.github/workflows/rollback.yml`
- `workflow_dispatch` с `image_tag` параметром
- Pull предыдущего образа из GHCR
- Замена контейнера + health check
- Telegram уведомления

### TASK-INFRA-004: Создать `scripts/deploy-vps.sh`
- Blue-Green деплой через pull готовых образов из GHCR
- Pre-flight checks (диск, PostgreSQL, nginx)
- DB backup
- GREEN контейнер → health check → nginx switch → stop BLUE
- Smoke tests с авто-роулбэком
- Cleanup старых образов (keep 10)

### TASK-INFRA-005: Создать `scripts/rollback-vps.sh`
- Pull указанного образа из GHCR
- DB backup
- Замена контейнера
- Health check (24 попытки × 5 сек)
- Nginx reload

### TASK-INFRA-006: Исправить Dockerfile-ы
- Backend: `python:3.12-slim-bookworm` (pin bookworm, не trixie)
- Frontent: `node:20-alpine` (уже OK, проверить standalone output)

### TASK-INFRA-007: Обновить `.env.example`
- Добавить `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_PROXY_URL`

## 3. Критерии приёмки

1. `ci.yml` — reusable, вызывается из deploy и PR
2. Сборка образов в GitHub Actions, push в GHCR
3. VPS только `docker pull` + `docker run` (без `npm ci` / `apt-get`)
4. Blue-Green деплой с health check и авто-роулбэком
5. Отдельный rollback workflow (pull образа за 30 сек)
6. Telegram уведомления при успехе/провале
7. `concurrency: deploy-production` — только один деплой за раз
8. Pin базовых образов (bookworm для backend)

## 4. Файлы

### Изменить:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `backend/services/content/Dockerfile`
- `.env.example`
- `frontend/.github/workflows/ci.yml` → удалить (дубликат, теперь в корневом ci.yml)

### Создать:
- `.github/workflows/rollback.yml`
- `scripts/deploy-vps.sh`
- `scripts/rollback-vps.sh`

### Не трогать:
- `docker-compose.dev.yml` (локальная разработка)
- `docker-compose.blue.yml` / `docker-compose.green.yml` (могут понадобиться для ручного деплоя)
- `nginx/`, `scripts/deploy.sh`, `scripts/version.sh` и др. (оставить как fallback)
