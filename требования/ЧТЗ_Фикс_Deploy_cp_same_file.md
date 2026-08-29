# ЧТЗ: Фикс бага `cp` same-file в `scripts/deploy-vps.sh` (Monitoring Setup)

**Дата:** 2026-08-29
**Маршрут:** 1 (Стандартная: Аналитик → Разработчик → Тестировщик → DevOps)
**Исполнитель:** Разработчик (infra) → DevOps
**Тип:** Малая задача (1 файл, infra-only, без БД/API/архитектуры/контрактов)

## 1. Контекст и мотивация

При продакшн-деплое (workflow_dispatch run `33252512094`, 2026-08-29) blue-green деплой
приложения завершился успешно (prod работает на `sha-e53b8a1`), но постдеплойный шаг
«Monitoring Setup (Prometheus + Grafana)» упал с ошибкой:

```
err: cp: '/opt/app/monitoring/prometheus.alerts.yml' and
        '/opt/app/monitoring/prometheus.alerts.yml' are the same file
```

Из-за `set -euo pipefail` + `script_stop: true` скрипт аварийно завершился, и шаги
post-deploy smoke tests / Notify Telegram (Success) были пропущены — workflow помечен
`failure`, хотя приложение на проде живо и здорово.

### Корневая причина

`scripts/deploy-vps.sh`:
- line 4:   `APP_DIR="/opt/app"`
- line 480: `MONITORING_DIR="$APP_DIR/monitoring"`  →  `/opt/app/monitoring`
- line 522: `cp "$APP_DIR/monitoring/prometheus.alerts.yml" "$MONITORING_DIR/prometheus.alerts.yml"`

Поскольку `$APP_DIR/monitoring` == `$MONITORING_DIR` по определению, source и dest
всегда один и тот же путь. GNU `cp` отказывается копировать файл сам в себя и возвращает
non-zero → `set -e` абортит весь скрипт.

## 2. Цель

Устранить аварийный выход на постдеплойном шаге мониторинга: `cp` не должен вызываться,
когда source и dest — один и тот же файл; скрипт должен корректно логировать «already in
place» и продолжать выполнение до smoke tests.

## 3. Затронутые файлы (1)

- `scripts/deploy-vps.sh` — блок lines 521-523 (cp alert rules)

## 4. Детальное решение

Заменить безусловный `cp` на guarded-вариант: сравнить канонические пути source и dest
через `readlink -f`; если совпадают — файл уже на месте, только лог; иначе — `cp` как
раньше. Сохранить ветку `else` (cat ALERTEOF) для случая, когда файла нет в репо.

Псевдокод:
```bash
ALERTS_SRC="$APP_DIR/monitoring/prometheus.alerts.yml"
ALERTS_DST="$MONITORING_DIR/prometheus.alerts.yml"
if [ -f "$ALERTS_SRC" ]; then
    if [ "$(readlink -f "$ALERTS_SRC")" = "$(readlink -f "$ALERTS_DST" 2>/dev/null || true)" ]; then
        log "  Alert rules already in place ($ALERTS_DST)"
    else
        cp "$ALERTS_SRC" "$ALERTS_DST"
        log "  Alert rules installed from repo (monitoring/prometheus.alerts.yml)"
    fi
else
    ... cat > ALERTEOF (без изменений) ...
fi
```

## 5. Критерии приёмки

1. `bash -n scripts/deploy-vps.sh` — без синтаксических ошибок.
2. При `MONITORING_DIR == $APP_DIR/monitoring` и существующем alerts-файле: `cp` НЕ
   вызывается (нет ошибки same-file), скрипт продолжает выполнение.
3. При различных `MONITORING_DIR` и source-путь существует: `cp` выполняется корректно.
4. Локальный smoke: `bash -c 'set -euo pipefail; APP_DIR=/tmp/xx; MONITORING_DIR=$APP_DIR/monitoring; mkdir -p $MONITORING_DIR; touch $MONITORING_DIR/prometheus.alerts.yml; <guarded-блок>'` — exit 0.
5. Повторный workflow_dispatch deploy доходит до шага «Post-deploy smoke tests» без abort
   на Monitoring Setup.

## 6. Не входит в задачу

- Изменения логики blue-green, миграций, образов, nginx, app-кода.
- Изменение набора sync-файлов в `deploy.yml`.
- Генерация `SITE_METRICS_KEY` на VPS (отдельная задача PROD-ENV-001, не блокирует деплой).
