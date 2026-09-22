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

## 6. BUG-001 (найден на постдеплойной верификации 2026-09-22)

**Симптом:** POST https://da-dryclean.ru/api/orders → 404 (ожидалось 400/200).
Прямой запрос в контейнер frontend → 400 (роут и SMTP работают).

**Причина:** nginx (VPS `/etc/nginx/nginx.conf`, не менялся с 29.08) маршрутизирует
`location /api/` → content-сервис, у которого нет /orders. Location `/api/orders`
→ frontend отсутствует и на VPS, и в `nginx/prod.conf` репозитория. Заявки с
Hero/CTA форм (`fetch("/api/orders")`) не доходили до деплоя — предсуществующий баг.

**Фикс (BUGFIX-1):** добавить `location /api/orders` → `$frontend_upstream`
(зеркало блока `/api/price-list`) в `nginx/prod.conf` (repo) и в
`/etc/nginx/nginx.conf` (VPS, nginx -t + reload). Пересборка образов не нужна.

**Критерий приёмки:** POST `/api/orders` (невалидный payload) через HTTPS → 400;
регрессия: сайт 200, `/api/v1/catalog/services` → 200 (content), metrics guard 403.

## 7. BUG-002 (найден при E2E-проверке SMTP, 2026-09-22)

**Симптом:** валидная заявка → `502 email_failed`. Логи: `EAI_AGAIN smtp.yandex.ru`,
после релея — `Hostname/IP does not match certificate's altnames: IP: 172.22.0.1`.

**Причина:** контейнеры dryclean-net не имеют outbound (ядро VPS без nf_nat):
ни DNS, ни TCP наружу. SMTP из frontend-контейнера невозможен напрямую.

**Фикс (BUGFIX-2):**
1. nginx stream-ретранслятор на шлюзе моста: `172.22.0.1:465 → smtp.yandex.ru:465`
   (TCP-passthrough, TLS+AUTH end-to-end). Конфиг: `nginx/smtp-stream.conf` (repo) →
   `/etc/nginx/smtp-stream.conf` (VPS) + `load_module ngx_stream_module.so`.
2. `/opt/app/.env`: `SMTP_HOST=172.22.0.1`, `SMTP_TLS_SERVERNAME=smtp.yandex.ru`.
3. `route.ts`: `tls: { servername: SMTP_TLS_SERVERNAME || host }` — SNI-валидация
   сертификата Яндекса при подключении по IP.
4. `deploy-vps.sh`: проброс `SMTP_TLS_SERVERNAME` в контейнер.

**Критерий приёмки:** POST валидной заявки через HTTPS → `{"ok":true,"channel":"email"}`;
email доставлен на SMTP_TO (проверяет владелец). Регрессия: без SMTP env — легаси-прокси.
