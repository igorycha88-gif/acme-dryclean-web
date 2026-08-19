# ЧТЗ: Фикс embedded DNS Docker на VPS (ядро/iptables) — метрики БД и стабильность прода

> Дата: 2026-08-19 · Сервер: p1002565.vps (37.143.15.148), прод da-dryclean.ru
> Приоритет: ВЫСОКИЙ · Маршрут: инфраструктурная задача (Аналитик → DevOps)
> Обнаружено при подключении центрального мониторинга (проект «Мониторинг сайтов», ЭПИК-9 / ADR-007)

## 1. Симптомы

- `dryclean-postgres-exporter` не может подключиться к БД:
  `dial tcp: lookup dryclean-postgres on 127.0.0.11:53: connection refused` → `pg_up = 0`.
- Разрешение имён **полностью не работает внутри контейнеров**:
  `docker run --rm --network dryclean-net busybox nslookup dryclean-postgres` → timeout.
- Даже `dryclean-tracking` не может разрезолвить `dryclean-postgres`
  (`socket.gethostbyname` → `Temporary failure in name resolution`).

## 2. Корневая причина (подтверждено диагностики)

Кастомное ядро VPS `5.2.0 #1 SMP` не поддерживает ни один режим iptables,
необходимый Docker для embedded DNS (127.0.0.11):

1. **iptables-nft (текущий режим):** dockerd не может создать DNAT-правила:
   `iptables -t nat -I OUTPUT -d 127.0.0.11 -j DOCKER_OUTPUT` →
   `CHAIN_ADD failed (No such file or directory): chain OUTPUT` (журнал dockerd).
2. **iptables-legacy:** таблица `nat` отсутствует — модули ядра не найдены:
   `modprobe iptable_nat` / `modprobe nf_nat` → `Module not found in /lib/modules/5.2.0`.

Следствие: embedded DNS Docker (127.0.0.11:53) не работает. Существующие
сервисы сайта (tracking→postgres) держатся только на уже установленных
long-lived соединениях. **Любой reconnect по имени, рестарт контейнера или
новый деплой упадёт** — сайт сейчас в неустойчивом состоянии.

## 3. Что уже сделано (временный воркараунд, 2026-08-19)

- `dryclean-postgres-exporter` пересоздан вручную (`docker run`) с
  `--add-host postgres:172.22.0.3 --add-host dryclean-postgres:172.22.0.3`
  → `pg_up = 1` (746 метрик БД).
- `docker-compose.prod.yml`: в сервис `postgres-exporter` добавлен
  `extra_hosts` (бэкап: `docker-compose.prod.yml.bak-dns-fix`).
- iptables возвращён в `nft` (штатный режим), docker перезапущен —
  все сервисы сайта healthy, сайт 200.
- Экспорт метрик для центрального мониторинга работает
  (`/metrics/{tracking,content,node,postgres}` за X-Monitoring-Key).

## 4. Зачем нужна реализация (бизнес-обоснование)

1. **Стабильность прода.** Без работающего DNS контейнеров следующий
   деплой/рестарт с высокой вероятностью уронит связность сервисов
   (tracking/content → postgres). Сейчас это отложенный инцидент.
2. **Мониторинг БД.** `pg_*`-метрики (746 шт.: соединения, транзакции,
   кэши, репликация, размеры таблиц) — единственный источник данных о
   здоровье PostgreSQL. Без них деградация БД обнаруживается только по
   падению сайта. Центральный мониторинг уже настроен: алерты
   SiteMetricsEndpointDown/NodeExporterDown, дашборд «Бизнес сайта».
3. **Бизнес-аналитика.** Метрики БД дополняют `business_*`-метрики
   (посетители, лиды, конверсия) и дают объяснение аномалий
   (например: рост отказов = медленные запросы = нет соединений в пуле).
4. **Масштабирование.** Любой будущий сервис (админка, воркеры,
   blue-green green-окружение) потребует DNS между контейнерами.

## 5. Задачи

### TASK-DNS-1. Статический IP postgres (устранить хрупкость воркараунда)
`extra_hosts` указывает на `172.22.0.3`, но IP не гарантирован при
пересоздании сети. В `docker-compose.prod.yml` (и blue/green):

```yaml
networks:
  dryclean-net:
    ipam:
      config:
        - subnet: 172.22.0.0/16
          # postgres закрепить статикой:
services:
  postgres:
    networks:
      dryclean-net:
        ipv4_address: 172.22.0.3
```

⚠️ Перед применением: `docker network inspect dryclean-net` — убедиться,
что текущий subnet 172.22.0.0/16 и IP 172.22.0.3 свободен/совпадает.
Применять в окно обслуживания (рестарт сети).

### TASK-DNS-2. Тот же `extra_hosts` в blue/green compose
Проверить `docker-compose.blue.yml` / `docker-compose.green.yml`: если
в них есть `postgres-exporter` или другие сервисы, ходящие в postgres
по имени, — добавить аналогичный `extra_hosts` (после TASK-DNS-1 —
на статический IP).

### TASK-DNS-3. Постоянное решение — обновление ядра VPS (основная задача)
Воркараунд — костыль; правильный фикс — ядро с модулями netfilter:

1. Запросить у хостера (timeweb-like VPS, kernel 5.2.0 custom) установку
   стандартного ядра дистрибутива или опцию выбора ядра.
2. Либо (если доступно): `apt install linux-image-generic-hwe-22.04`
   (или соответствующий релиз Ubuntu), обновить grub, reboot в окно.
3. Проверка после reboot:
   ```bash
   modprobe nf_nat && echo NAT_OK
   docker run --rm --network dryclean-net busybox nslookup dryclean-postgres
   ```
4. Если ядро обновлено и DNS работает — `extra_hosts` из compose-файлов
   можно удалить (шаг опционален, мешать не будут).

Если ядро обновить невозможно (ограничение хостера) — зафиксировать
решение: остаёмся на `extra_hosts` + статических IP (TASK-DNS-1/2),
документируем ограничение в DEPLOY.md проекта: «новые контейнеры требуют
extra_hosts, embedded DNS не работает».

### TASK-DNS-4. Внешний мониторинг БД на стороне сайта
Добавить в свой Prometheus (`/opt/app/monitoring/prometheus.yml`) scrape
`postgres-exporter` (127.0.0.1:9187) — дублирование контроля pg_up
независимо от центрального мониторинга. Алерт в своём Prometheus:
`pg_up == 0` на 5 минут.

### TASK-DNS-5. Регресс-проверка после любых инфраструктурных изменений
В чек-лист деплоя добавить шаг:
```bash
docker run --rm --network dryclean-net busybox nslookup dryclean-postgres
curl -s -H "X-Monitoring-Key: $KEY" https://da-dryclean.ru/metrics/postgres | grep '^pg_up 1'
```

## 6. Критерии приёмки

1. `docker run --rm --network dryclean-net busybox nslookup dryclean-postgres`
   — резолвится (после TASK-DNS-3) **или** задокументировано ограничение ядра
   и применены TASK-DNS-1/2 (статические IP + extra_hosts во всех compose).
2. `pg_up = 1` стабильно ≥ 24 ч (центральный мониторинг и/или свой Prometheus).
3. Тестовый деплой (blue-green переключение) проходит без потери связности
   сервисов с postgres.
4. `docker compose -f docker-compose.prod.yml up -d postgres-exporter`
   воспроизводит рабочий контейнер (сейчас он запущен вручную, вне compose).
5. Рестарт `docker`/VPS не ломает подключение exporter'а к БД.

## 7. Риски / откат

- TASK-DNS-1 (перенумерация сети): делать в окно обслуживания; откат —
  вернуть `docker-compose.prod.yml.bak-dns-fix`.
- TASK-DNS-3 (смена ядра): риск несовместимости драйверов VPS — обязательно
   бэкап (снапшот хостера) и тестовый reboot; откат — выбор старого ядра в grub.
- Пока ядро не обновлено: **не перезапускать** dryclean-postgres/tracking/content
  без понимания, что новые соединения по имени не резолвятся (использовать
  extra_hosts/статические IP).

## 8. Ссылки

- ADR-007 центрального мониторинга (эндпоинты /metrics/* за X-Monitoring-Key):
  проект «Мониторинг сайтов», `требования/ADR-007_Интеграция_метрик_сайта.md`
- ЧТЗ экспорта метрик: `ЧТЗ_Сайт_da-dryclean_Метрики.md` (том же каталоге)
- Журнал: `journalctl -u docker` — ошибки `Resolver Start failed` (примеры выше)
