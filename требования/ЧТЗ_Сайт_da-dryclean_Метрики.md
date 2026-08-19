# ЧТЗ: Доработка сайта da-dryclean.ru — экспорт бизнес- и сервисных метрик для внешнего мониторинга

> Версия: 1.0 · Дата: 2026-08-18 · Сервер: 37.143.15.148 · Домен: da-dryclean.ru
> Источник требования: центральный сервис мониторинга (проект «Мониторинг сайтов»)
> Спецификация мониторинга: ADR-007 проекта мониторинга

## 1. Контекст и цель

Центральный мониторинг должен собирать метрики сайта da-dryclean.ru:
бизнес-метрики (трафик, лиды, конверсия) и сервисные (сервер, БД, API).
Доступ мониторинга к метрикам — **только через существующий HTTPS (443)
с аутентификацией по ключу**. Новые порты наружу НЕ открываются.

## 2. Ключ доступа (КРИТИЧНО, раздел безопасности)

Приложение мониторинга обращается к эндпоинтам метрик с заголовком:

```
X-Monitoring-Key: 8e35ebac0fb4df6a290ff4bd93611944851136615d1f2b4c8606c24be00f2d5b
```

Требования к хранению ключа:
- nginx: значение ключа — в отдельном файле `/etc/nginx/conf.d/monitoring-key.conf`
  (владелец root:root, права 600; nginx читает конфиги master-процессом от root);
- переменная `MONITORING_API_KEY` в `/opt/app/.env` (для сервисов, если понадобится
  проверять ключ на уровне приложения — не обязательно, проверка в nginx);
- ключ НЕ коммитить в репозиторий, не писать в логи и docker-compose.

## 3. Архитектура взаимодействия

```
Мониторинг (локальная сборка / VPS 130.49.129.241)
        │  GET https://da-dryclean.ru/metrics/{kind}
        │  заголовок X-Monitoring-Key: <ключ>
        ▼
nginx :443 (TLS LE) ── проверка ключа + rate limit ──┬─ /metrics/tracking → 127.0.0.1:8020/metrics
                                                      ├─ /metrics/content  → 127.0.0.1:$content_port/metrics (blue-green!)
                                                      ├─ /metrics/node     → 127.0.0.1:9100/metrics (node_exporter)
                                                      └─ /metrics/postgres → 127.0.0.1:9187/metrics (postgres_exporter)
```

## 4. Задачи

### TASK-SITE-1. nginx: защищённые location'ы метрик

1. Создать `/etc/nginx/conf.d/monitoring-key.conf` (chmod 600, root:root):

```nginx
map $http_x_monitoring_key $metrics_key_ok {
    default 0;
    "8e35ebac0fb4df6a290ff4bd93611944851136615d1f2b4c8606c24be00f2d5b" 1;
}
limit_req_zone $binary_remote_addr zone=metrics_limit:10m rate=10r/s;
```

2. В server{} (443, da-dryclean.ru) добавить 4 location (все — только GET,
   ключ обязателен, rate limit, без кэша):

```nginx
location = /metrics/tracking {
    if ($metrics_key_ok = 0) { return 403; }
    limit_req zone=metrics_limit burst=20 nodelay;
    proxy_pass http://127.0.0.1:8020/metrics;
    proxy_set_header Host $host;
}
location = /metrics/content {
    if ($metrics_key_ok = 0) { return 403; }
    limit_req zone=metrics_limit burst=20 nodelay;
    proxy_pass http://127.0.0.1:$content_port/metrics;   # карта active_env уже есть
    proxy_set_header Host $host;
}
location = /metrics/node {
    if ($metrics_key_ok = 0) { return 403; }
    limit_req zone=metrics_limit burst=20 nodelay;
    proxy_pass http://127.0.0.1:9100/metrics;
    proxy_set_header Host $host;
}
location = /metrics/postgres {
    if ($metrics_key_ok = 0) { return 403; }
    limit_req zone=metrics_limit burst=20 nodelay;
    proxy_pass http://127.0.0.1:9187/metrics;
    proxy_set_header Host $host;
}
```

3. `nginx -t` → reload. Существующие location'ы (`/`, `/api/`, `/uploads/`,
   health) не изменять. Контейнеры dryclean-* (свой Prometheus/Grafana сайта)
   не трогать.

### TASK-SITE-2. tracking: бизнес-метрики (gauge, пересчёт из БД)

Фоновая задача (APScheduler/asyncio, интервал 60 с, отдельная сессия БД)
пересчитывает и выставляет gauge-метрики в prometheus_client. Существующие
`tracking_events_total` / `tracking_event_duration_seconds` не менять.

| Метрика (gauge) | Лейблы | Формула (окно 24ч до now UTC) |
|---|---|---|
| `business_sessions_active` | — | сессии с `last_activity_at > now()-30m` |
| `business_page_views_24h` | — | count(events, event_type=page_view) |
| `business_page_views_1h` | — | то же, окно 1ч |
| `business_unique_visitors_24h` | — | count(distinct visitor_id по событиям) |
| `business_sessions_24h` | — | count(sessions started за 24ч) |
| `business_avg_session_duration_seconds_24h` | — | avg(duration_seconds) по сессиям 24ч |
| `business_bounce_rate_24h` | — | доля сессий 24ч с page_views_count ≤ 1 (0..1) |
| `business_events_24h` | `event_type` | count(events) group by event_type |
| `business_leads_24h` | — | events: form_submit + phone_click + messenger_click |
| `business_leads_1h` | — | то же, окно 1ч |
| `business_conversion_rate_24h` | — | leads_24h / unique_visitors_24h (0 если 0/0) |
| `business_referral_sources_24h` | `source` | count(sessions 24ч) group by referrer_group |
| `business_geo_visitors_24h` | `city` | count(distinct visitor_id) group by geo_city; топ-10, остальное → `other`; NULL → `unknown` |
| `business_service_clicks_24h` | `service` | count(events event_type=service_click) group by payload→service (или event_name); топ-20, остальное → `other` |

Требования:
- Обновление не должно блокировать обработку событий (отдельная задача, try/except
  с логированием ошибки, при ошибке — прежние значения остаются).
- Один SQL-запрос на метрику или групповой — допустимо, но вся задача ≤ 5 с.
- Добавить unit-тесты на расчёт формул (фикстуры событий/сессий).

### TASK-SITE-3. content: HTTP-метрики сервиса

1. prometheus_client (создать `app/core/metrics.py` по образцу tracking):

```
content_http_requests_total{method, route, code}      — Counter
content_http_request_duration_seconds{method, route}  — Histogram (buckets 0.005..2.5)
```

- `route` — шаблон маршрута (например `/content/services/{slug}`), НЕ сырой
  путь (контроль кардинальности); статические файлы → `/static`.
- `/metrics` и `/health` не считать.

2. Endpoint `GET /metrics` (как в tracking).
3. Middleware/dependency для подсчёта всех HTTP-запросов + тест.

### TASK-SITE-4. node_exporter (сервисные метрики сервера)

```bash
# скачать последний node_exporter (linux-amd64) → /usr/local/bin/node_exporter
# systemd unit /etc/systemd/system/node_exporter.service:
[Service]
ExecStart=/usr/local/bin/node_exporter --web.listen-address=127.0.0.1:9100
Restart=always
User=node_exporter (создать системного пользователя без shell)
```

Бинд строго на 127.0.0.1:9100. Файрвол не открывать.

### TASK-SITE-5. postgres_exporter (метрики БД)

1. Read-only пользователь метрик:

```sql
CREATE USER metrics_exporter WITH LOGIN PASSWORD '<сгенерировать свой>';
GRANT CONNECT ON DATABASE dryclean_content TO metrics_exporter;
GRANT pg_monitor TO metrics_exporter;
```

2. Контейнер в compose (проект dryclean):

```yaml
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: dryclean-postgres-exporter
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: postgresql://metrics_exporter:<пароль>@postgres:5432/dryclean_content?sslmode=disable
    ports:
      - "127.0.0.1:9187:9187"
```

Пароль — в .env, права 600. Порт только 127.0.0.1.

### TASK-SITE-6. Blue-green

`/metrics/content` обязан указывать на АКТИВНОЕ окружение через уже
существующую map-переменную `$content_port`. После переключения blue↔green
метрики content продолжают отдаваться без правок конфига.

## 5. Критерии приёмки

```bash
KEY=8e35ebac0fb4df6a290ff4bd93611944851136615d1f2b4c8606c24be00f2d5b
# Без ключа — 403 на всех четырёх путях:
curl -s -o /dev/null -w '%{http_code}\n' https://da-dryclean.ru/metrics/tracking   # 403
# С ключом — 200 и body в формате Prometheus:
curl -s -H "X-Monitoring-Key: $KEY" https://da-dryclean.ru/metrics/tracking | grep -c '^business_'   # > 0
curl -s -H "X-Monitoring-Key: $KEY" https://da-dryclean.ru/metrics/content  | grep '^content_http_'  # есть
curl -s -H "X-Monitoring-Key: $KEY" https://da-dryclean.ru/metrics/node     | grep '^node_cpu_seconds_total'  # есть
curl -s -H "X-Monitoring-Key: $KEY" https://da-dryclean.ru/metrics/postgres | grep '^pg_'  # есть
# POST отклоняется, скорость ограничена (429 при бусте >20 req/s)
```

- Существующий функционал сайта не затронут (фронт, /api/, админка).
- Свой Prometheus/Grafana сайта (dryclean-*) продолжают работать.
- Метрики доступны только по HTTPS; http:// → 301 на https (уже есть).
- Секреты (ключ, пароль metrics_exporter) не в git.

## 6. Что недопустимо

- Открывать порты 9100/9187/8020/8011 наружу (0.0.0.0).
- Править SSH/файрвол-правила, кроме случая явной необходимости (обсудить).
- Отдавать метрики без проверки ключа или по HTTP.
- Трогать контейнеры monitoring-* на других серверах.
