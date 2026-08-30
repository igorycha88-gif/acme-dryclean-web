# ЧТЗ: Фикс _agg_phone_clicks — учёт click_phone (ADR-012)

**Версия:** 1.0
**Дата:** 2026-08-30
**Связанные:** ЧТЗ_Сайт_da_dryclean_Полные_Бизнес_Метрики (§2.1), ADR-012
**Тип:** Малая задача (1 файл, раздел 6 AGENTS.md)
**Маршрут:** Аналитик → Разработчик → Тестировщик → DevOps (Этап 5: прод-деплой)

## 1. Проблема

`backend/services/tracking/app/services/analytics.py:210` — метод `_agg_phone_clicks`
(используется GET `/api/v1/tracking/stats`) фильтрует события только по
`event_type == "phone_click"`. Frontend (ADR-012) отправляет `event_type == "click_phone"`.
В результате stats endpoint не учитывает реальные клики по телефону.

Business-метрики (`business_phone_clicks_*`) используют правильный
`PHONE_CLICK_EVENT_TYPES = ("click_phone", "phone_click")` — на них баг НЕ влияет.

## 2. Требования

1. В `_agg_phone_clicks` фильтровать по обоим типам: `click_phone` и `phone_click`
   (legacy). Использовать `.in_(...)` по образцу `business_metrics.py:234`.
2. Сохранить группировку по `payload["phone"]` и существующую сигнатуру метода.

## 3. Критерии приёмки

1. `_agg_phone_clicks` учитывает события `click_phone` и `phone_click`.
2. GET `/api/v1/tracking/stats` возвращает `phone_clicks` с событиями `click_phone`.
3. Существующие тесты `test_phone_click_api.py` + `test_business_metrics.py` проходят.
4. Quality Gate: `pytest tests/ -v --cov=app && ruff check . && mypy app/` — PASS.

## 4. Файлы

- `backend/services/tracking/app/services/analytics.py` (1 строка в `_agg_phone_clicks`)
- (опц.) `backend/services/tracking/tests/test_phone_click_api.py` — доп. тест для stats

## 5. Вопросы

Нет: образец фикса задан в `business_metrics.py:234` (`PHONE_CLICK_EVENT_TYPES`).
