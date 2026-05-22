# Архитектура системы — Сайт химчистки (DryClean Pro)

## 1. Обзор системы

Веб-платформа для службы химчистки с функциями онлайн-заказа, отслеживания статуса, оплаты, доставки и управления бизнес-процессами.

### 1.1 Ключевые бизнес-требования

| Требование | Описание |
|---|---|
| Онлайн-заказ | Клиент выбирает услуги, указывает адрес забора/доставки, выбирает время |
| Отслеживание заказа | Реальное время: принят → в обработке → готов → доставлен |
| Оплата онлайн | Карты, СБП, электронные кошельки |
| SMS/Push-уведомления | Статус заказа, промо-акции, напоминания |
| Лояльность | Бонусная система, промокоды, реферальная программа |
| Админ-панель | Управление заказами, сотрудниками, расписанием, аналитика |
| Мобильная адаптация | PWA / Адаптивный сайт / Мобильное приложение (API) |

---

## 2. Выбор технологического стека

### 2.1 Основной стек

| Компонент | Технология | Обоснование |
|---|---|---|
| **Язык** | Python 3.12+ | Быстрая разработка, богатая экосистема |
| **Фреймворк API** | **FastAPI** | Async, автодокументация (OpenAPI), высокая производительность, типизация через Pydantic |
| **ORM** | SQLAlchemy 2.0 + Alembic | Зрелый ORM с async-поддержкой, миграции |
| **БД** | PostgreSQL 16 | Надёжность, JSON-поля, полнотекстовый поиск, PostGIS для гео |
| **Кэш/Сессии** | Redis 7 | Кэширование, rate-limiting, хранение сессий, pub/sub |
| **Брокер сообщений** | RabbitMQ | Надёжная доставка сообщений между сервисами |
| **Фоновые задачи** | Celery 5 | Отправка email/SMS, генерация отчётов, синхронизация |
| **API Gateway** | Nginx + Traefik | Маршрутизация, TLS, rate-limiting, балансировка |
| **Контейнеризация** | Docker + Docker Compose | Изоляция сервисов, воспроизводимое окружение |
| **Оркестрация** | Kubernetes (k3s для прод) | Масштабирование, self-healing, rolling updates |
| **Мониторинг** | Prometheus + Grafana | Метрики, алерты, дашборды |
| **Логирование** | ELK Stack (Lightweight: Loki) | Централизованные логи |
| **CI/CD** | GitHub Actions | Автоматизация тестирования и деплоя |
| **Аутентификация** | JWT + OAuth 2.0 | Stateless, масштабируемая авторизация |

### 2.2 Почему FastAPI, а не Django

- **Производительность**: FastAPI на уровне Node.js/Go (ASGI + async)
- **Автодокументация**: Swagger UI из коробки
- **Типизация**: Pydantic v2 — валидация и сериализация данных
- **Микросервисы**: Легковесный, идеально подходит для small services
- **Modern Python**: Async/await, type hints

---

## 3. Микросервисная архитектура

### 3.1 Диаграмма сервисов

```
                          ┌─────────────┐
                          │   Клиент    │
                          │  (Web/Mob)  │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │ API Gateway │  (Nginx / Traefik)
                          │  + Auth     │
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
     ┌────────▼───────┐ ┌───────▼───────┐  ┌───────▼────────┐
     │  User Service  │ │ Order Service │  │ Catalog Service│
     │  :8001         │ │ :8002         │  │ :8003          │
     └────────┬───────┘ └───────┬───────┘  └───────┬────────┘
              │                 │                   │
     ┌────────▼───────┐ ┌───────▼───────┐  ┌───────▼────────┐
     │  Auth Service  │ │Payment Service│  │ Pricing Service│
     │  :8004         │ │ :8005         │  │ :8006          │
     └────────────────┘ └───────┬───────┘  └────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
     ┌────────▼───────┐ ┌──────▼──────┐  ┌───────▼────────┐
     │Notification Svc│ │Delivery Svc │  │  Review/Rating │
     │  :8007         │ │ :8008       │  │  Service :8009 │
     └────────┬───────┘ └──────┬──────┘  └────────────────┘
              │                │
              │         ┌──────▼──────┐
              │         │ Loyalty Svc │
              │         │ :8010       │
              │         └─────────────┘
              │
     ┌────────▼──────────────────────────────────────────┐
     │           RabbitMQ (Message Broker)                │
     └────────────────────────────────────────────────────┘
              │
     ┌────────▼──────────────────────────────────────────┐
     │           Redis (Cache / Sessions / PubSub)        │
     └────────────────────────────────────────────────────┘
              │
     ┌────────▼──────────────────────────────────────────┐
     │           PostgreSQL (отдельная БД на сервис)      │
     └────────────────────────────────────────────────────┘
```

### 3.2 Описание сервисов

#### 3.2.1 API Gateway (nginx + custom auth middleware)
- Единая точка входа
- TLS-терминация
- Rate limiting
- Маршрутизация запросов к сервисам
- JWT-валидация

#### 3.2.2 User Service (`:8001`)
- Регистрация/авторизация клиентов
- Профили пользователей (ФИО, телефоны, адреса)
- Управление адресами доставки
- История заказов (через запрос к Order Service)

**БД**: `users_db` — таблицы: `users`, `addresses`, `user_preferences`

#### 3.2.3 Auth Service (`:8004`)
- Выдача и валидация JWT-токенов
- OAuth 2.0 (Google, Apple, Telegram)
- Refresh token rotation
- RBAC (клиент, оператор, курьер, админ)

**БД**: `auth_db` — таблицы: `sessions`, `refresh_tokens`, `roles`, `permissions`

#### 3.2.4 Order Service (`:8002`) — **Core сервис**
- Создание заказа
- Жизненный цикл заказа (FSM)
- Назначение курьера
- Отслеживание статуса в реальном времени
- Расчёт стоимости (вызов Pricing Service)

**БД**: `orders_db` — таблицы: `orders`, `order_items`, `order_status_history`, `courier_assignments`

**Статус-машина заказа**:
```
NEW → CONFIRMED → PICKUP_SCHEDULED → PICKED_UP → PROCESSING → 
READY → DELIVERY_SCHEDULED → DELIVERING → DELIVERED → COMPLETED
                                    ╳
                                CANCELLED (на любом этапе до PICKED_UP)
```

#### 3.2.5 Catalog Service (`:8003`)
- Каталог услуг (химчистка одежды, мебели, ковров и т.д.)
- Категории услуг
- Управление типами тканей/материалов
- Время выполнения по типу услуги

**БД**: `catalog_db` — таблицы: `categories`, `services`, `service_items`, `fabric_types`, `service_fabric_rules`

#### 3.2.6 Pricing Service (`:8006`)
- Расчёт стоимости заказа
- Динамическое ценообразование
- Применение промокодов
- Скидки по программе лояльности
- Налоги и наценки

**БД**: `pricing_db` — таблицы: `price_rules`, `promocodes`, `discount_tiers`, `tax_rates`

#### 3.2.7 Payment Service (`:8005`)
- Приём платежей (интеграция с платёжными системами)
- Возвраты
- Чеки (интеграция с 54-ФЗ)
- Реестр платежей

**Интеграции**: ЮKassa / Tinkoff / СберPay

**БД**: `payments_db` — таблицы: `payments`, `refunds`, `transactions`, `receipts`

#### 3.2.8 Notification Service (`:8007`)
- Email (SMTP / SendGrid)
- SMS (SMSAero / Twilio)
- Push-уведомления (Firebase)
- Telegram-бот уведомления
- Шаблоны сообщений

**БД**: `notifications_db` — таблицы: `notification_templates`, `notification_log`, `device_tokens`

#### 3.2.9 Delivery Service (`:8008`)
- Управление курьерами
- Маршрутизация (интеграция с картами)
- Гео-трекинг курьеров
- Временные слоты доставки
- Расчёт ETA

**Интеграции**: Yandex Maps API / 2GIS

**БД**: `delivery_db` — таблицы: `couriers`, `delivery_slots`, `routes`, `courier_locations`

#### 3.2.10 Loyalty Service (`:8010`)
- Бонусные баллы
- Уровни лояльности (Bronze/Silver/Gold/Platinum)
- Реферальная программа
- Промо-акции и кэмпейны

**БД**: `loyalty_db` — таблицы: `loyalty_accounts`, `transactions`, `referrals`, `campaigns`, `promo_codes`

#### 3.2.11 Review Service (`:8009`)
- Отзывы клиентов
- Рейтинги сервисов
- Модерация отзывов
- Ответы администратора

**БД**: `reviews_db` — таблицы: `reviews`, `review_responses`

---

## 4. Паттерны проектирования

### 4.1 Коммуникация между сервисами

| Паттерн | Применение |
|---|---|
| **Sync (HTTP/gRPC)** | Запросы, требующие немедленного ответа (проверка цены, авторизация) |
| **Async (RabbitMQ)** | Уведомления, обновление статусов, события домена |
| **Event Sourcing** | История изменений статуса заказа |
| **Saga (Choreography)** | Координация заказа: Order → Payment → Delivery → Notification |
| **CQRS** | Разделение чтения/записи для Order Service (отчёты vs. создание) |
| **Outbox Pattern** | Надёжная доставка событий в RabbitMQ |

### 4.2 Saga: Создание заказа (Choreography)

```
Order Service    → OrderCreated event
  ├── Pricing Service   → PriceCalculated event
  ├── Payment Service   → PaymentRequested → PaymentCompleted/PaymentFailed
  ├── Delivery Service  → DeliveryScheduled event
  └── Notification Svc  → NotificationSent (на каждом этапе)
```

### 4.3 Обработка сбоев

- **Circuit Breaker** — защита от каскадных сбоев (библиотека `circuitbreaker`)
- **Retry with Exponential Backoff** — повторные попытки с задержкой
- **Dead Letter Queue** — в RabbitMQ для необработанных сообщений
- **Compensating Transactions** — отмена в Saga (возврат платежа при ошибке)

---

## 5. Структура проекта

```
dryclean-pro/
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── k8s/                          # Kubernetes manifests
│   ├── namespace.yaml
│   ├── gateway/
│   ├── user-service/
│   ├── order-service/
│   ├── ... (на сервис)
│   └── monitoring/
├── services/
│   ├── gateway/                   # API Gateway (nginx config + auth middleware)
│   │   ├── nginx.conf
│   │   ├── Dockerfile
│   │   └── auth_middleware.py
│   │
│   ├── user-service/
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   ├── alembic/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── router.py
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── users.py
│   │   │   │   │   │   └── addresses.py
│   │   │   ├── core/
│   │   │   │   ├── security.py
│   │   │   │   ├── deps.py
│   │   │   │   └── exceptions.py
│   │   │   ├── models/
│   │   │   │   ├── user.py
│   │   │   │   └── address.py
│   │   │   ├── schemas/
│   │   │   │   ├── user.py
│   │   │   │   └── address.py
│   │   │   ├── services/
│   │   │   │   └── user_service.py
│   │   │   └── repositories/
│   │   │       └── user_repo.py
│   │   ├── tests/
│   │   └── scripts/
│   │
│   ├── auth-service/
│   │   └── ... (аналогичная структура)
│   │
│   ├── order-service/
│   │   └── ...
│   │
│   ├── catalog-service/
│   │   └── ...
│   │
│   ├── pricing-service/
│   │   └── ...
│   │
│   ├── payment-service/
│   │   └── ...
│   │
│   ├── notification-service/
│   │   └── ...
│   │
│   ├── delivery-service/
│   │   └── ...
│   │
│   ├── loyalty-service/
│   │   └── ...
│   │
│   └── review-service/
│       └── ...
│
├── shared/                        # Общие библиотеки
│   ├── pyproject.toml
│   └── shared_lib/
│       ├── __init__.py
│       ├── database.py            # Base DB session, Base model
│       ├── messaging.py           # RabbitMQ helpers
│       ├── auth.py                # JWT utilities
│       ├── logging.py             # Structured logging config
│       ├── tracing.py             # OpenTelemetry setup
│       └── exceptions.py          # Common exceptions
│
├── frontend/                      # Frontend (опционально)
│   └── ... (React/Next.js или Vue/Nuxt)
│
├── docs/
│   ├── api/                       # OpenAPI specs
│   ├── diagrams/                  # Architecture diagrams
│   └── runbook/                   # Operational guides
│
├── scripts/
│   ├── setup_dev.sh
│   ├── run_tests.sh
│   └── seed_db.py
│
└── README.md
```

---

## 6. Структура одного микросервиса (шаблон)

Каждый сервис следует одинаковой внутренней структуре (Layered Architecture):

```
service-name/
├── app/
│   ├── main.py               # FastAPI app, lifespan events
│   ├── config.py             # Pydantic Settings
│   ├── api/                  # Слой API (контроллеры)
│   │   └── v1/
│   │       ├── router.py     # Роутер версии API
│   │       └── endpoints/    # Endpoint-обработчики
│   ├── schemas/              # Pydantic-схемы (DTO)
│   ├── services/             # Бизнес-логика
│   ├── repositories/         # Слой доступа к данным
│   ├── models/               # SQLAlchemy модели
│   ├── core/                 # Конфигурация, DI, exceptions
│   ├── consumers/            # RabbitMQ consumers (event handlers)
│   └── producers/            # RabbitMQ producers (event publishers)
├── alembic/                  # Миграции БД
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── Dockerfile
├── pyproject.toml
└── README.md
```

### Слои и ответственность

| Слой | Ответственность | Пример |
|---|---|---|
| `api/endpoints/` | HTTP-обработка, валидация входа | `@router.post("/orders")` |
| `schemas/` | Сериализация/десериализация | `OrderCreate`, `OrderResponse` |
| `services/` | Бизнес-логика, оркестрация | `create_order(items, user_id)` |
| `repositories/` | Запросы к БД | `get_order_by_id()`, `save_order()` |
| `models/` | Описание таблиц БД | `class Order(Base)` |
| `consumers/` | Обработка событий из RabbitMQ | `handle_payment_completed()` |
| `producers/` | Публикация событий | `publish_order_created()` |

---

## 7. Безопасность

### 7.1 Аутентификация и авторизация
- JWT (access token: 15 мин, refresh token: 7 дней)
- OAuth 2.0 Password + Authorization Code flows
- Telegram Login Widget
- RBAC с ролями: `client`, `operator`, `courier`, `admin`

### 7.2 Защита данных
- Шифрование паролей: `bcrypt` (через `passlib`)
- HTTPS везде (TLS 1.3)
- Секреты в Vault / Kubernetes Secrets
- Персональные данные зашифрованы в БД (PGP)
- Маскирование номера карты, телефона в логах

### 7.3 Защита API
- Rate limiting (Nginx + Redis)
- CORS (только разрешённые домены)
- Input validation (Pydantic)
- SQL injection protection (ORM)
- XSS protection (заголовки безопасности)

---

## 8. Масштабирование

### 8.1 Горизонтальное масштабирование

| Сервис | Стратегия |
|---|---|
| Order Service | Scale по количеству заказов |
| Notification Service | Scale по длине очереди RabbitMQ |
| API Gateway | Scale по RPS |
| Остальные | Scale по нагрузке (CPU/Memory) |

### 8.2 БД масштабирование
- **Read Replicas** для тяжёлых read-запросов (каталог, отзывы)
- **Connection Pooling** через PgBouncer
- **Partitioning** таблицы `orders` по дате
- **Sharding** при росте (future)

---

## 9. Мониторинг и наблюдаемость

### 9.1 Метрики (Prometheus)
- RPS на сервис
- Latency (p50, p95, p99)
- Error rate
- Active orders
- Queue depth (RabbitMQ)
- DB connections

### 9.2 Логи (Loki + Grafana)
- Structured JSON logs
- Correlation ID (trace_id) через все сервисы
- Уровни: INFO, WARNING, ERROR

### 9.3 Трейсинг (OpenTelemetry + Jaeger)
- Distributed tracing через все сервисы
- Latency breakdown по слоям

---

## 10. Этапы разработки

### Фаза 1 — MVP (8-10 недель)
1. API Gateway + Auth Service
2. User Service (регистрация, профиль)
3. Catalog Service (каталог услуг)
4. Order Service (создание и отслеживание)
5. Payment Service (базовая оплата)
6. Notification Service (email + SMS)
7. Frontend (лэндинг + клиентская часть)

### Фаза 2 — Расширение (6-8 недель)
1. Delivery Service (курьеры, гео)
2. Pricing Service (динамическое ценообразование)
3. Loyalty Service (бонусы)
4. Review Service (отзывы)
5. Admin Panel

### Фаза 3 — Оптимизация (4-6 недель)
1. Мобильное приложение (используя существующее API)
2. Аналитический дашборд
3. Telegram-бот
4. A/B тестирование
5. Оптимизация производительности

---

## 11. Ключевые зависимости (pyproject.toml)

```toml
[project]
name = "dryclean-pro"
requires-python = ">=3.12"

[tool.poetry.dependencies]
fastapi = "^0.115"
uvicorn = {extras = ["standard"], version = "^0.32"}
sqlalchemy = {extras = ["asyncio"], version = "^2.0"}
asyncpg = "^0.30"
alembic = "^1.14"
pydantic = {extras = ["email"], version = "^2.10"}
pydantic-settings = "^2.7"
python-jose = {extras = ["cryptography"], version = "^3.3"}
passlib = {extras = ["bcrypt"], version = "^1.7"}
python-multipart = "^0.0.18"
celery = {extras = ["rabbitmq"], version = "^5.4"}
redis = "^5.2"
httpx = "^0.28"
aio-pika = "^9.5"
opentelemetry-api = "^1.29"
opentelemetry-sdk = "^1.29"
opentelemetry-instrumentation-fastapi = "^0.50b0"
structlog = "^24.4"
tenacity = "^9.0"
circuitbreaker = "^2.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.3"
pytest-asyncio = "^0.24"
pytest-cov = "^6.0"
httpx = "^0.28"
ruff = "^0.8"
mypy = "^1.13"
```
