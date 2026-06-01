# ЧТЗ: Аналитический дашборд Grafana для бизнес-метрик сайта

## Версия: 1.1
## Дата: 2026-06-01
## Автор: AI-Аналитик (архитектурное решение: ADR-001)
## Приоритет: High
## Статус: Согласовано

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Получить прозрачную картину поведения посетителей сайта: откуда приходят, какие услуги интересуют, сколько оставляют заявок, по каким каналам связи предпочитают обращаться.

### 1.2 Пользовательская ценность
Владелец бизнеса видит в реальном времени:
- Какие услуги пользуются спросом (химчистка диванов, авто, ковров и т.д.)
- Какие каналы связи работают лучше (телефон, Telegram, МАКС)
- Динамику заявок (пиковые часы, дни недели)
- Эффективность сайта (конверсия, bounce rate)

### 1.3 Метрики успеха
- Все бизнес-события с фронтенда сохраняются в БД (точность 99.9%)
- Дашборд Grafana отображает данные с задержкой не более 60 секунд
- Дашборд доступен по URL http://localhost:3030 (логин/пароль admin/admin)
- Время загрузки дашборда < 3 секунд

---

## 2. Функциональные требования

### 2.1 User Stories с Acceptance Criteria (Given-When-Then)

**US-001: Отслеживание посетителей сайта**
- **Роль:** admin
- **AC-001:** GIVEN пользователь открывает любую страницу сайта WHEN скрипт трекера загружается THEN отправляется событие `page_view` с page_url, referrer, timestamp
- **AC-002:** GIVEN тот же пользователь переходит на другую страницу в течение 30 минут WHEN происходит page_view THEN session_id не меняется (та же сессия)
- **AC-003:** GIVEN пользователь неактивен более 30 минут WHEN происходит новый page_view THEN создаётся новая сессия

**US-002: Отслеживание кликов по услугам**
- **Роль:** admin
- **AC-001:** GIVEN пользователь на главной странице WHEN кликает по карточке услуги (диваны, авто, куклы, ковры, матрасы, ковролин) THEN отправляется событие `service_click` с service_id, service_name, page_url
- **AC-002:** GIVEN пользователь на странице /uslugi WHEN кликает по услуге THEN отправляется событие `service_click` с slug услуги

**US-003: Отслеживание кликов по телефону**
- **Роль:** admin
- **AC-001:** GIVEN пользователь видит номер телефона в TopBar WHEN кликает по номеру THEN отправляется событие `phone_click` с phone (phoneRaw или phoneAltRaw)
- **AC-002:** GIVEN пользователь в футере WHEN кликает по номеру телефона THEN отправляется событие `phone_click`

**US-004: Отслеживание кликов в мессенджеры**
- **Роль:** admin
- **AC-001:** GIVEN пользователь видит кнопку Telegram в TopBar WHEN кликает THEN отправляется событие `messenger_click` с messenger="telegram"
- **AC-002:** GIVEN пользователь видит кнопку МАКС в TopBar WHEN кликает THEN отправляется событие `messenger_click` с messenger="max"
- **AC-003:** GIVEN пользователь открывает плавающую кнопку MessengerButton WHEN кликает Telegram или МАКС THEN отправляется событие `messenger_click`

**US-005: Отслеживание заявок с форм**
- **Роль:** admin
- **AC-001:** GIVEN пользователь отправляет форму в Hero WHEN submit успешен THEN отправляется событие `form_submit` с form_location="hero", service_type, success=true
- **AC-002:** GIVEN пользователь отправляет форму в CTAForm WHEN submit успешен THEN отправляется событие `form_submit` с form_location="cta", service_type, success=true
- **AC-003:** GIVEN отправка формы завершилась ошибкой WHEN submit не успешен THEN отправляется событие `form_submit` с success=false

**US-006: Просмотр бизнес-дашборда**
- **Роль:** admin
- **AC-001:** GIVEN admin открывает http://localhost:3030 WHEN вводит логин/пароль THEN видит дашборд с панелями
- **AC-002:** GIVEN дашборд открыт WHEN прошло менее 60 секунд THEN все панели показывают актуальные данные
- **AC-003:** GIVEN admin выбирает период (24ч / 7д / 30д) WHEN применяет фильтр THEN данные пересчитываются

**US-007: API для трекинга событий**
- **Роль:** system (сервис)
- **AC-001:** GIVEN клиентское приложение WHEN отправляет POST /api/v1/tracking/event с валидным телом THEN сервис возвращает 200 и сохраняет событие
- **AC-002:** GIVEN клиентское приложение WHEN отправляет POST с невалидным телом THEN сервис возвращает 422
- **AC-003:** GIVEN Prometheus WHEN делает GET /metrics THEN возвращаются метрики количества событий по типам

**US-008: Источники трафика**
- **Роль:** admin
- **AC-001:** GIVEN посетитель пришёл по прямой ссылке WHEN session создана THEN referrer = "direct"
- **AC-002:** GIVEN посетитель пришёл из поисковика (yandex, google) WHEN session создана THEN referrer = "organic:yandex" / "organic:google"
- **AC-003:** GIVEN посетитель пришёл из соцсети (t.me, vk.com) WHEN session создана THEN referrer = "social:telegram" / "social:vk"

**US-009: География посетителей**
- **Роль:** admin
- **AC-001:** GIVEN приходит событие page_view WHEN сервис получает IP THEN определяется город через GeoIP
- **AC-002:** GIVEN город определён WHEN данные агрегируются THEN дашборд показывает топ-10 городов

---

## 3. Нефункциональные требования

### 3.1 Производительность
- POST /api/v1/tracking/event — ответ < 50ms (асинхронная запись в БД)
- GET /metrics — ответ < 100ms
- GET /api/v1/tracking/stats — ответ < 200ms для любого периода
- Prometheus scraping interval: 15 секунд
- Grafana refresh interval: 30 секунд

### 3.2 Безопасность
- Tracking API не требует аутентификации (публичный endpoint для событий)
- CORS ограничен доменом сайта
- Rate limiting: не более 100 запросов/сек с одного IP
- Метрики Prometheus доступны только внутри Docker-сети (не публикуются наружу)
- Grafana: базовая аутентификация (admin/admin)

### 3.3 Масштабируемость
- База данных аналитики не блокирует основные сервисы (отдельная таблица)
- Запись событий асинхронная (фоновые задачи)
- Старые данные (старше 90 дней) автоматически архивируются
- При падении Tracking Service — сайт продолжает работать (события теряются, но это некритично)

### 3.4 Доступность
- Tracking Service: без SLA (опциональный сервис)
- Потеря единичных событий допустима
- Дашборд Grafana: 99% (плановые остановки для обновления дашбордов)

### 3.5 Наблюдаемость
- Tracking Service логирует каждое событие (debug-уровень)
- Prometheus метрики: количество событий по типам, latency, error rate
- В Grafana добавлена панель «Здоровье сервиса» (up/down, latency, events/sec)

---

## 4. Техническая архитектура

### 4.1 Затронутые микросервисы и компоненты

| Сервис | Роль |
|--------|------|
| **Tracking Service (новый)** | Приём, валидация, сохранение событий; Prometheus metrics |
| **PostgreSQL** | Таблицы `analytics.events`, `analytics.sessions` |
| **Prometheus (новый)** | Сбор метрик со всех сервисов + Tracking Service |
| **Grafana (новый)** | Визуализация дашбордов (datasources: Prometheus + PostgreSQL) |
| **Frontend** | Client-side трекер, отслеживание событий |
| **docker-compose.dev.yml** | Добавление новых сервисов |

### 4.2 Изменения в БД (PostgreSQL, база dryclean_content)

#### Таблица `analytics_events`

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    -- page_view, service_click, phone_click, messenger_click, form_submit
    event_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    geo_city VARCHAR(100),
    geo_country VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_payload ON analytics_events USING GIN (payload jsonb_path_ops);
```

#### Таблица `analytics_sessions`

```sql
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE,
    visitor_id VARCHAR(100) NOT NULL, -- fingerprint / cookie
    first_page_url TEXT,
    referrer TEXT,
    referrer_group VARCHAR(50), -- direct, organic:yandex, organic:google, social:telegram, social:vk
    user_agent TEXT,
    ip_address INET,
    geo_city VARCHAR(100),
    geo_country VARCHAR(100),
    page_views_count INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX idx_analytics_sessions_visitor ON analytics_sessions(visitor_id);
CREATE INDEX idx_analytics_sessions_started ON analytics_sessions(started_at DESC);
CREATE INDEX idx_analytics_sessions_group ON analytics_sessions(referrer_group);
```

### 4.3 API спецификация

#### POST /api/v1/tracking/event
Публичный endpoint для приёма событий с фронтенда. Не требует аутентификации.

**Request:**
```json
{
  "session_id": "uuid-сессии",
  "visitor_id": "fingerprint-посетителя",
  "event_type": "page_view | service_click | phone_click | messenger_click | form_submit",
  "event_name": "опциональное название",
  "payload": {
    "service_id": 1,
    "service_name": "Химчистка диванов",
    "phone": "+74952261573",
    "messenger": "telegram",
    "form_location": "hero",
    "service_type": "himchistka-divanov",
    "success": true
  },
  "page_url": "/",
  "referrer": "https://yandex.ru/search/..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "event_id": "uuid"
  }
}
```

**Response 422 (невалидные данные):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "event_type must be one of: page_view, service_click, phone_click, messenger_click, form_submit"
  }
}
```

#### GET /api/v1/tracking/stats
Агрегированные данные (для дашборда).

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| period | string | 24h, 7d, 30d (default: 24h) |

**Response 200:**
```json
{
  "visitors": 245,
  "unique_visitors": 189,
  "page_views": 567,
  "bounce_rate": 35.5,
  "avg_duration_seconds": 145,
  "avg_pages_per_session": 2.3,
  "service_clicks": {
    "himchistka-divanov": 45,
    "himchistka-salona-avtomobilya": 30,
    "himchistka-rostovyh-kukol": 12,
    "himchistka-kovrov": 28,
    "himchistka-matrasov": 22,
    "himchistka-kovrolina": 18
  },
  "phone_clicks": {
    "+74952261573": 35,
    "+79852261573": 20
  },
  "messenger_clicks": {
    "telegram": 25,
    "max": 15
  },
  "form_submits": {
    "total": 40,
    "by_location": {
      "hero": 25,
      "cta": 15
    },
    "success_rate": 92.5
  },
  "sources": {
    "direct": 80,
    "organic:yandex": 60,
    "organic:google": 30,
    "social:telegram": 10,
    "social:vk": 5
  },
  "top_cities": [
    {"city": "Москва", "visitors": 120},
    {"city": "Московская область", "visitors": 45}
  ],
  "hourly_distribution": {
    "0": 5, "1": 2, "2": 1, "3": 0, "4": 0, "5": 1,
    "6": 3, "7": 8, "8": 15, "9": 25, "10": 30, "11": 35,
    "12": 32, "13": 28, "14": 30, "15": 35, "16": 33,
    "17": 30, "18": 28, "19": 22, "20": 18, "21": 12,
    "22": 8, "23": 5
  }
}
```

#### GET /metrics
Prometheus-метрики (для Prometheus scraper).

### 4.4 RabbitMQ события
Не требуются (трекинг — синхронный REST, запись асинхронная через background tasks).

### 4.5 Структура файлов нового сервиса

```
backend/services/tracking/
├── Dockerfile
├── pyproject.toml
├── alembic/
│   ├── env.py
│   ├── versions/
│   │   └── 001_create_analytics_tables.py
│   └── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, lifespan, CORS
│   ├── config.py            # Pydantic Settings
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── track.py       # POST /event
│   │           └── stats.py       # GET /stats
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── event.py         # EventCreate, EventResponse
│   │   └── stats.py         # StatsResponse
│   ├── services/
│   │   ├── __init__.py
│   │   └── analytics.py     # Бизнес-логика записи и агрегации
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py          # Base model
│   │   └── analytics.py     # AnalyticsEvent, AnalyticsSession модели
│   ├── core/
│   │   ├── __init__.py
│   │   ├── database.py      # AsyncSession factory
│   │   ├── metrics.py       # Prometheus метрики
│   │   └── geo.py           # GeoIP определение города
│   └── tasks/
│       ├── __init__.py
│       └── cleanup.py       # Архивация старых данных (90 дней)
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_track.py
    ├── test_stats.py
    └── test_models.py
```

### 4.6 Интерфейсы/типы данных

**Pydantic models (schemas/event.py):**

```python
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Any, Literal

EventType = Literal[
    "page_view", "service_click", "phone_click",
    "messenger_click", "form_submit"
]

class EventCreate(BaseModel):
    session_id: UUID
    visitor_id: str = Field(max_length=100)
    event_type: EventType
    event_name: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    page_url: str | None = None
    referrer: str | None = None

class EventResponse(BaseModel):
    event_id: UUID
    created_at: datetime

class ServiceClickPayload(BaseModel):
    service_id: int | None = None
    service_slug: str | None = None
    service_name: str | None = None

class PhoneClickPayload(BaseModel):
    phone: str  # маскированный номер

class MessengerClickPayload(BaseModel):
    messenger: Literal["telegram", "max"]

class FormSubmitPayload(BaseModel):
    form_location: Literal["hero", "cta"]
    service_type: str | None = None
    success: bool
```

**Grafana Dashboard JSON model:**
Дашборды описываются как JSON (см. раздел 6).

### 4.7 Frontend: Client-side трекер

Новый файл: `frontend/src/lib/tracker.ts`

```typescript
interface TrackEvent {
  session_id: string;
  visitor_id: string;
  event_type: 'page_view' | 'service_click' | 'phone_click' | 'messenger_click' | 'form_submit';
  event_name?: string;
  payload: Record<string, unknown>;
  page_url?: string;
  referrer?: string;
}
```

Трекер:
- Генерирует `visitor_id` (localStorage, fallback случайный UUID)
- Управляет `session_id` (30 минут таймаут)
- Отправляет события через `navigator.sendBeacon()` или `fetch()` с флагом `keepalive: true`
- Не блокирует UI
- Автоматически отправляет `page_view` на каждом роуте

---

## 5. Edge Cases и Error Cases

### 5.1 Edge cases
1. **Множественные быстрые клики** — пользователь кликает по одной услуге 10 раз за секунду. Ожидание: сервис принимает все события (rate limit 100/сек/IP).
2. **Офлайн-режим** — пользователь открыл сайт, но нет интернета. Ожидание: событие не теряется (отправка при восстановлении соединения через sendBeacon или очередь).
3. **Очень длинная сессия** — пользователь держит вкладку открытой сутки. Ожидание: session_id не меняется, last_activity_at обновляется.
4. **AdBlock** — блокирует запросы к tracking API. Ожидание: сайт работает, ошибки трекера игнорируются.
5. **Пустой referrer** — пользователь открыл сайт из закладок. Ожидание: referrer = "direct".
6. **Событие с неполным payload** — пришёл service_click без service_id. Ожидание: событие сохраняется, service_id = null.

### 5.2 Error cases (HTTP статусы)
| Код | Ситуация | Ответ |
|-----|----------|-------|
| 200 | Успех | `{"success": true, "data": {"event_id": "..."}}` |
| 400 | event_type невалидный | `{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "..."}}` |
| 422 | body не соответствует схеме | Детали валидации Pydantic |
| 429 | Превышен rate limit | `{"success": false, "error": {"code": "RATE_LIMIT", "message": "Too many requests"}}` |
| 500 | Внутренняя ошибка | `{"success": false, "error": {"code": "INTERNAL", "message": "Internal server error"}}` |

### 5.3 Обработка ошибок
- Все ошибки записываются в лог (WARNING/ERROR)
- Prometheus счётчик ошибок инкрементируется
- При недоступности БД — возвращается 500, событие теряется (fire-and-forget)

---

## 6. UI/UX требования

### 6.1 Состав дашборда Grafana

Дашборд "Бизнес-аналитика — D&A Dry Cleaning"

**Панели (panels):**

| # | Название | Тип | Источник данных | Описание |
|---|----------|-----|-----------------|----------|
| 1 | Посетители (24ч) | Stat | PostgreSQL | Количество уникальных session_id за 24ч |
| 2 | Просмотры страниц | Stat | PostgreSQL | Количество page_view событий за 24ч |
| 3 | Заявки (24ч) | Stat | PostgreSQL | Количество form_submit с success=true |
| 4 | Конверсия (24ч) | Stat | PostgreSQL | % заявок от уникальных посетителей |
| 5 | Клики по услугам | Bar gauge | PostgreSQL | По каждой из 6 услуг |
| 6 | Клики по телефонам | Pie chart | PostgreSQL | 2 номера: +74952261573, +79852261573 |
| 7 | Клики в мессенджеры | Stat | PostgreSQL | Telegram vs МАКС |
| 8 | Посетители по часам | Time series | PostgreSQL | 24-часовой график |
| 9 | Источники трафика | Pie chart | PostgreSQL | direct, organic, social |
| 10 | Топ городов | Table | PostgreSQL | Таблица с городом и количеством |
| 11 | Динамика заявок (7д) | Time series | PostgreSQL | График заявок по дням |
| 12 | Популярные страницы | Table | PostgreSQL | page_url + количество просмотров |
| 13 | Bounce rate | Stat | PostgreSQL | % сессий с 1 страницей |
| 14 | События/сек (live) | Time series | Prometheus | event_count rate |
| 15 | Здоровье сервиса | Stat | Prometheus | up/down статус tracking service |

### 6.2 Макет дашборда (текстовый)

```
┌────────────────────────────────────────────────────────────────┐
│  🔍 D&A Dry Cleaning — Бизнес-аналитика     [24ч] [7д] [30д]  │
├──────────┬──────────┬──────────┬──────────┬───────────────────┤
│ 👥       │ 👁       │ 📋       │ 📈       │                    │
│ 189      │ 567      │ 37       │ 19.6%    │                    │
│Посетители│Просмотры │ Заявки   │Конверсия │                    │
├──────────┴──────────┴──────────┴──────────┴───────────────────┤
│ Клики по услугам              │   Телефоны     │  Мессенджеры  │
│ ┌────────────────────────┐    │  ┌──────────┐  │ ┌──────────┐ │
│ │ Диваны      ████████ 45│    │  │ Тел.1    │  │ │Telegram 25│ │
│ │ Авто        ██████  30│    │  │ 63%      │  │ │ МАКС   15│ │
│ │ Ковры       █████   28│    │  │ Тел.2    │  │ └──────────┘ │
│ │ Матрасы     ████    22│    │  │ 37%      │  │              │
│ │ Ковролин    ███     18│    │  └──────────┘  │              │
│ │ Куклы       ██      12│    │                 │              │
│ └────────────────────────┘    └─────────────────┘              │
├────────────────────────────────────────────────────────────────┤
│ Посетители по часам (24ч)                                     │
│  40 ┤            ▄▄▄▄                                         │
│  30 ┤     ▄▄▄▄▄▄▀▀▀▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄                          │
│  20 ┤  ▄▄▀▀                    ▀▀▀▀▄▄▄▄▄▄▄                    │
│  10 ┤ ▀▀                                ▀▀▀▀▄▄▄▄▄──           │
│     └───────────────────────────────────────────────────       │
│       0  2  4  6  8  10 12 14 16 18 20 22                     │
├──────────────────────────┬────────────────────────────────────┤
│ Источники трафика        │ Топ городов                        │
│  ┌───────────┐          │ ┌─────────────────┬──────────┐    │
│  │ direct    │ 42%      │ │ Москва          │      120 │    │
│  │ organic   │ 38%      │ │ МО              │       45 │    │
│  │ social    │ 8%       │ │ Санкт-Петербург │       12 │    │
│  │ other     │ 12%      │ └─────────────────┴──────────┘    │
│  └───────────┘          │                                    │
├──────────────────────────┴────────────────────────────────────┤
│ Динамика заявок (7д)                                         │
│  15 ┤        ▄▄▄▄                                             │
│  10 ┤   ▄▄▄▄▀▀▀▀▄▄▄▄▄▄▄▄  ▄▄▄                                │
│   5 ┤▄▄▀▀          ▀▀▀▀▀▀▀▀▀▀▀▀▄▄▄▄▄                         │
│     └────────────────────────────────────                      │
│       Пн Вт Ср Чт Пт Сб Вс                                   │
└────────────────────────────────────────────────────────────────┘
│ 🟢 Все сервисы healthy  |  📊 Данные за 24ч  |  ⚡ Live        │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Декомпозиция на задачи (DAG)

### Backend (Tracking Service)
| ID | Название | Часы | Зависимости |
|----|----------|------|-------------|
| TASK-BCK-001 | Структура сервиса: main.py, config.py, database.py, зависимости | 1.5 | — |
| TASK-BCK-002 | Модели SQLAlchemy (AnalyticsEvent, AnalyticsSession) | 1 | TASK-BCK-001 |
| TASK-BCK-003 | Alembic миграция: создание таблиц analytics_events, analytics_sessions | 0.5 | TASK-BCK-002 |
| TASK-BCK-004 | Pydantic схемы: EventCreate, EventResponse, StatsResponse | 1 | TASK-BCK-001 |
| TASK-BCK-005 | Endpoint POST /api/v1/tracking/event | 1.5 | TASK-BCK-002, TASK-BCK-004 |
| TASK-BCK-006 | Endpoint GET /api/v1/tracking/stats | 2 | TASK-BCK-002, TASK-BCK-004 |
| TASK-BCK-007 | Сервис analytics.py: запись событий, агрегация, referrer_group | 2 | TASK-BCK-002 |
| TASK-BCK-008 | Prometheus метрики (event_count, latency, errors) | 1 | TASK-BCK-001 |
| TASK-BCK-009 | GeoIP определение города | 1 | TASK-BCK-001 |
| TASK-BCK-010 | Rate limiter (100 req/sec/IP) | 1 | TASK-BCK-001 |
| TASK-BCK-011 | Background task: очистка старых данных (90 дней) | 0.5 | TASK-BCK-002 |

### Frontend
| ID | Название | Часы | Зависимости |
|----|----------|------|-------------|
| TASK-FRT-001 | Client-side трекер: tracker.ts (session, visitor, sendBeacon) | 2 | — |
| TASK-FRT-002 | Интеграция трекера в layout.tsx (page_view на каждый роут) | 0.5 | TASK-FRT-001 |
| TASK-FRT-003 | Трекинг кликов по услугам (Services.tsx) | 0.5 | TASK-FRT-001 |
| TASK-FRT-004 | Трекинг кликов по телефону (TopBar.tsx, Footer) | 0.5 | TASK-FRT-001 |
| TASK-FRT-005 | Трекинг кликов в мессенджеры (TopBar.tsx, MessengerButton.tsx) | 0.5 | TASK-FRT-001 |
| TASK-FRT-006 | Трекинг отправки форм (Hero.tsx, CTAForm.tsx) | 0.5 | TASK-FRT-001 |

### Infrastructure
| ID | Название | Часы | Зависимости |
|----|----------|------|-------------|
| TASK-INF-001 | Dockerfile для Tracking Service | 0.5 | TASK-BCK-001 |
| TASK-INF-002 | Добавление tracking + prometheus + grafana в docker-compose.dev.yml | 1 | TASK-INF-001 |
| TASK-INF-003 | Конфигурация Prometheus (prometheus.yml) | 0.5 | TASK-INF-002 |
| TASK-INF-004 | Настройка Grafana: datasources, provisioning | 1 | TASK-INF-002 |
| TASK-INF-005 | Создание Grafana dashboard JSON (бизнес-дашборд) | 2 | TASK-INF-004 |

### Testing
| ID | Название | Часы | Зависимости |
|----|----------|------|-------------|
| TASK-TST-001 | Unit-тесты: schemas, валидация | 1 | TASK-BCK-004 |
| TASK-TST-002 | Unit-тесты: models, запись/чтение событий | 1 | TASK-BCK-002 |
| TASK-TST-003 | Integration-тесты: POST /event + GET /stats | 1.5 | TASK-BCK-005, TASK-BCK-006 |
| TASK-TST-004 | Unit-тесты: referrer_group, GeoIP, rate limiter | 1 | TASK-BCK-009, TASK-BCK-010 |

### Граф зависимостей

```
TASK-BCK-001 (каркас сервиса)
  ├→ TASK-BCK-002 (модели) → TASK-BCK-003 (миграция)
  │     └→ TASK-BCK-007 (сервис analytics) → TASK-BCK-005 (POST /event) → TASK-TST-003
  │                                         → TASK-BCK-006 (GET /stats) → TASK-TST-003
  ├→ TASK-BCK-004 (схемы) → TASK-BCK-005, TASK-BCK-006 → TASK-TST-001
  ├→ TASK-BCK-008 (Prometheus метрики)
  ├→ TASK-BCK-009 (GeoIP) → TASK-TST-004
  └→ TASK-BCK-010 (rate limiter) → TASK-TST-004
  └→ TASK-BCK-011 (cleanup)

TASK-FRT-001 (трекер)
  ├→ TASK-FRT-002 (layout.tsx)
  ├→ TASK-FRT-003 (Services.tsx)
  ├→ TASK-FRT-004 (TopBar.tsx)
  ├→ TASK-FRT-005 (MessengerButton.tsx)
  └→ TASK-FRT-006 (Hero.tsx, CTAForm.tsx)

TASK-INF-001 (Dockerfile) → TASK-INF-002 (docker-compose)
  ├→ TASK-INF-003 (prometheus.yml)
  └→ TASK-INF-004 (grafana provisioning) → TASK-INF-005 (дашборд)

TASK-BCK-001 → TASK-INF-001 (нужен билд сервиса)
```

**Порядок выполнения:**
1. TASK-BCK-001 → TASK-BCK-002 → TASK-BCK-003 (БД)
2. TASK-BCK-004, TASK-BCK-007, TASK-BCK-009, TASK-BCK-010 (логика)
3. TASK-BCK-005, TASK-BCK-006, TASK-BCK-008 (endpoints + метрики)
4. TASK-INF-001 → TASK-INF-002 → TASK-INF-003 → TASK-INF-004 → TASK-INF-005 (инфра)
5. TASK-FRT-001 → TASK-FRT-002..006 (фронтенд)
6. TASK-TST-001..004 (тесты параллельно)

---

## 8. Маршрутизация

**Архитектор:** ТРЕБУЕТСЯ
- Новый микросервис (Tracking Service)
- Новая сущность в БД (таблицы analytics_events, analytics_sessions)
- Новый API-контекст (>3 endpoints: POST /event, GET /stats, GET /metrics)
- Добавление Prometheus + Grafana в инфраструктуру

**Исполнитель после Архитектора:** Разработчик
**Затронутые сервисы:** Tracking Service (новый), PostgreSQL, Prometheus (новый), Grafana (новый), Frontend
**Обоснование:** задача затрагивает архитектуру (новый микросервис, новые таблицы, новая инфраструктура мониторинга), требуется Architectural Decision Record.

---

## 9. Влияние на существующий функционал

### 9.1 Затронутые сервисы
- **Frontend:** добавляется tracker.ts, изменяются 6 компонентов (добавление onClick → trackEvent)
- **Content Service:** не изменяется
- **PostgreSQL:** добавляются 2 новые таблицы в существующую БД dryclean_content
- **docker-compose:** добавляются 3 новых сервиса (tracking, prometheus, grafana)

### 9.2 Регрессионные риски
- **Низкий:** трекер работает асинхронно, не влияет на UI
- **Низкий:** новые таблицы в БД не влияют на существующие
- **Низкий:** новые сервисы в docker-compose независимы

### 9.3 Backward compatibility
- Все изменения обратно совместимы. Старый функционал не изменяется.
- Docker-compose обновляется, старые сервисы продолжают работать

---

## 10. Тестирование

### 10.1 Unit-тесты
- Валидация EventCreate (все event_type, пустой payload, невалидный event_type)
- Валидация referrer_group (direct, organic:yandex, organic:google, social:telegram, social:vk)
- Сессионная логика (новая сессия, продление, таймаут 30 мин)

### 10.2 Integration-тесты
- POST /api/v1/tracking/event → 200 + событие в БД
- POST /api/v1/tracking/event невалидные данные → 422
- GET /api/v1/tracking/stats — проверка агрегации
- Rate limit: 101 запрос → 429

### 10.3 Тестовые данные
```python
test_events = [
    {"session_id": uuid4(), "visitor_id": "v1", "event_type": "page_view", "payload": {}},
    {"session_id": uuid4(), "visitor_id": "v1", "event_type": "service_click", "payload": {"service_name": "Химчистка диванов", "service_slug": "himchistka-divanov"}},
    {"session_id": uuid4(), "visitor_id": "v1", "event_type": "phone_click", "payload": {"phone": "+74952261573"}},
    {"session_id": uuid4(), "visitor_id": "v1", "event_type": "messenger_click", "payload": {"messenger": "telegram"}},
    {"session_id": uuid4(), "visitor_id": "v1", "event_type": "form_submit", "payload": {"form_location": "hero", "service_type": "himchistka-divanov", "success": True}},
]
```

---

## 11. Риски и зависимости

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Отказ Prometheus | Низкая | Потеря live-метрик | Данные дублируются в PostgreSQL |
| AdBlock блокирует tracking | Высокая | Часть событий теряется | sendBeacon + fallback fetch |
| Высокая нагрузка (DDoS) | Низкая | Перегрузка БД | Rate limiter + keepalive connection pool |
| Grafana забудет пароль | Средняя | Потеря доступа | Provisioning через config + reset |

---

## 12. Согласование

- [x] Заказчик (метрики согласованы)
- [ ] Техлид (ожидание Architecture Decision Record)
