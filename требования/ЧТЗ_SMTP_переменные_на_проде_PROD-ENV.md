# ЧТЗ — SMTP-переменные окружения на продакшене (PROD-ENV-001/002)

**Дата:** 2026-09-22
**Источник:** PROD-ANALYSIS перед деплоем 531fd3d..ebf1752
**Маршрут:** Аналитик → Разработчик → Тестировщик → DevOps → Прод-деплой
**Тип:** малая задача (1 файл репозитория + env на VPS)

## 1. Контекст

Коммит `ebf1752` (SMTP-отправка заявок через Яндекс) читает в runtime:
`SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_TO`, `SMTP_FROM`
(см. `frontend/src/app/api/orders/route.ts`).

Прод-деплой идёт через `scripts/deploy-vps.sh` (docker run контейнеров из GHCR).
Проверка VPS (37.143.15.148) показала:

- `docker run` для frontend (3 места: `deploy_direct`, green-frontend, blue-frontend
  в `deploy_blue_green`) передаёт только `NEXT_PUBLIC_*` — SMTP-переменных нет;
- в `/opt/app/.env` на VPS отсутствуют все `SMTP_*` переменные.

Без фикса фича не активируется (graceful fallback на старый прокси).

## 2. Задачи

### TASK-1 (PROD-ENV-001) — Разработчик

Пробросить SMTP-переменные из `/opt/app/.env` (скрипт делает `source .env`) в
frontend-контейнер во ВСЕХ ТРЁХ местах `docker run` файла `scripts/deploy-vps.sh`:

- `deploy_direct()` — запуск `dryclean-frontend`;
- `deploy_blue_green()` — запуск `dryclean-frontend-green`;
- `deploy_blue_green()` — перезапуск `dryclean-frontend` (blue).

Реализация: массив `SMTP_FRONTEND_ENV`, заполняемый только для установленных
переменных (пустые не передавать — сохраняется обратная совместимость, если
`.env` без SMTP). Переменные: HOST, PORT, SECURE, USER, PASS, TO, FROM.

### TASK-2 (PROD-ENV-002) — DevOps (на VPS по SSH)

Добавить в `/opt/app/.env` на VPS значения из локального `.env`:

```
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<из локального .env>
SMTP_PASS=<из локального .env>
SMTP_TO=igorycha.s@yandex.ru,da-drycleaning@mail.ru
```

`chmod 600`, значения не коммитить в репозиторий.

### TASK-3 — DevOps

- Коммит + push TASK-1 в `main` (workflow scp'ает скрипт на VPS из checkout).
- Запуск `deploy.yml` (workflow_dispatch), мониторинг до завершения.
- Постдеплойная верификация: env контейнера, smoke, `/active-env`, `check-dns.sh`.

## 3. Критерии приёмки

1. `bash -n scripts/deploy-vps.sh` проходит; shellcheck без критичных ошибок.
2. Все 3 `docker run` frontend содержат `"${SMTP_FRONTEND_ENV[@]}"`.
3. Если `.env` без SMTP-переменных — скрипт работает как раньше (массив пуст).
4. После деплоя: `docker inspect dryclean-frontend` содержит SMTP_USER/SMTP_PASS.
5. POST невалидной заявки на `/api/orders` → 400 (endpoint жив, не 500).
6. Сайт `https://da-dryclean.ru` отвечает 200; smoke-тесты workflow зелёные.
7. `scripts/check-dns.sh` на VPS: FAIL=0.

## 4. Риски и откат

- Риск LOW: меняется только деплой-скрипт; при отсутствии SMTP в `.env` поведение идентично текущему.
- Откат: `scripts/rollback-vps.sh` + auto-rollback workflow; образы по sha-тегам.

## 5. Файлы

- `scripts/deploy-vps.sh` (правка, TASK-1)
- `/opt/app/.env` на VPS (env, TASK-2)
