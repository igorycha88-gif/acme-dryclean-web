# Матрица навыков команды DryClean Pro

## На основе архитектурного заключения (ARCHITECTURE.md)

---

## 1. Навыки по ролям

### 🏗️ Архитектор

| Навык | Требование | Уровень | Источник в архитектуре |
|-------|-----------|---------|----------------------|
| **Микросервисная архитектура** | Проектирование database-per-service, API Gateway, межсервисное взаимодействие | Expert | ARCHITECTURE.md §3 |
| **Паттерны проектирования** | Saga (Choreography), CQRS, Event Sourcing, Outbox Pattern, Circuit Breaker | Expert | ARCHITECTURE.md §4 |
| **FastAPI** | Async endpoints, Pydantic v2, Dependency Injection, OpenAPI | Advanced | ARCHITECTURE.md §2.2 |
| **SQLAlchemy 2.0 + Alembic** | Async ORM, миграции, UUID PKs, JSONB, PostGIS | Advanced | ARCHITECTURE.md §2.1 |
| **PostgreSQL 16** | Partitioning, read replicas, fulltext search, connection pooling | Advanced | ARCHITECTURE.md §8.2 |
| **RabbitMQ** | Topic exchange, routing keys, dead letter queue, pub/sub | Advanced | ARCHITECTURE.md §4.1 |
| **Redis 7** | Кэширование, rate-limiting, sessions, pub/sub | Advanced | ARCHITECTURE.md §2.1 |
| **Docker + Kubernetes** | Multi-stage builds, k3s, HPA, rolling updates | Advanced | ARCHITECTURE.md §5 |
| **Мониторинг** | Prometheus + Grafana + Loki + OpenTelemetry | Advanced | ARCHITECTURE.md §9 |
| **Безопасность** | JWT/OAuth 2.0, RBAC, TLS 1.3, bcrypt, CORS | Advanced | ARCHITECTURE.md §7 |
| **Масштабирование** | Horizontal scaling, PgBouncer, read replicas, sharding | Advanced | ARCHITECTURE.md §8 |

### 📋 Аналитик

| Навык | Требование | Уровень | Источник в архитектуре |
|-------|-----------|---------|----------------------|
| **Сбор требований** | User Stories, Acceptance Criteria (Given-When-Then) | Expert | — |
| **Маршрутизация задач** | Определение: Архитектор / Разработчик / DevOps | Expert | SKILL_ANALYST.md §Маршрутизация |
| **API спецификация** | OpenAPI, REST, HTTP методы, статусы | Advanced | API_SPECIFICATION.md |
| **Схема БД** | Database per service, UUID, JSONB, soft delete | Advanced | DATABASE_SCHEMA.md |
| **Микросервисы** | Понимание 10 сервисов, их ответственности и контрактов | Advanced | ARCHITECTURE.md §3.2 |
| **Декомпозиция** | TASK-BCK/MSG/FRT/TST/INF/DOC, атомарность 0.5-4 часа | Expert | — |
| **RabbitMQ события** | Exchange, routing keys, producers/consumers | Intermediate | API_SPECIFICATION.md §Events |
| **UI/UX** | Дизайн-система, breakpoints, анимации | Intermediate | DESIGN_BRIEF.md §5-7 |

### 💻 Разработчик

| Навык | Требование | Уровень | Источник в архитектуре |
|-------|-----------|---------|----------------------|
| **Python 3.12+** | Type hints, async/await, dataclasses, generators | Expert | ARCHITECTURE.md §2.1 |
| **FastAPI** | Route handlers, Pydantic v2, DI, middleware, lifespan | Expert | ARCHITECTURE.md §2.2 |
| **SQLAlchemy 2.0** | Async sessions, ORM models, queries, relationships | Expert | ARCHITECTURE.md §2.1 |
| **Alembic** | Автогенерация миграций, upgrade/downgrade | Advanced | — |
| **PostgreSQL** | UUID, JSONB, GiST indexes, partitioning, fulltext search | Advanced | DATABASE_SCHEMA.md |
| **Redis** | aioredis, caching, pub/sub, rate-limiting | Advanced | ARCHITECTURE.md §2.1 |
| **RabbitMQ (aio-pika)** | Exchanges, queues, routing keys, DLQ | Advanced | ARCHITECTURE.md §4.1 |
| **Pydantic v2** | BaseModel, Field validators, serializers, Settings | Expert | ARCHITECTURE.md §2.2 |
| **JWT + OAuth 2.0** | python-jose, passlib, bcrypt, refresh rotation | Advanced | ARCHITECTURE.md §7.1 |
| **pytest** | pytest-asyncio, fixtures, coverage, mocking | Advanced | — |
| **mypy** | Strict mode, type checking | Advanced | — |
| **ruff** | Линтинг + форматирование | Advanced | — |
| **Celery 5** | Фоновые задачи, periodic tasks | Intermediate | ARCHITECTURE.md §2.1 |
| **httpx** | Async HTTP client, circuit breaker | Advanced | ARCHITECTURE.md §2.1 |
| **structlog** | Structured JSON logging, correlation IDs | Advanced | ARCHITECTURE.md §9 |
| **React / Next.js** | Server Components, App Router, TypeScript | Intermediate | DESIGN_BRIEF.md |
| **Tailwind CSS** | Responsive design, design system | Intermediate | DESIGN_BRIEF.md §5 |
| **Docker** | Dockerfile, multi-stage builds | Advanced | INFRASTRUCTURE.md §3 |

### 🧪 Тестировщик

| Навык | Требование | Уровень | Источник в архитектуре |
|-------|-----------|---------|----------------------|
| **Тест-дизайн** | Equivalence partitioning, boundary values, pairwise | Expert | — |
| **pytest** | Написание и выполнение тестов, fixtures, parametrize | Advanced | — |
| **API тестирование** | httpie / curl / Postman, HTTP статусы, JSON validation | Expert | API_SPECIFICATION.md |
| **Code Review** | Чтение Python кода, выявление дефектов, проверка логики | Expert | SKILL_TESTER.md §3.5 |
| **SQLAlchemy аудит** | N+1 queries, missing indexes, transaction safety | Advanced | DATABASE_SCHEMA.md |
| **Pydantic аудит** | Валидация, Optional поля, sensitive data в response | Advanced | — |
| **RabbitMQ аудит** | Idempotency, DLQ, retry logic, payload validation | Intermediate | — |
| **Security тестирование** | SQL injection, XSS, JWT validation, RBAC | Advanced | ARCHITECTURE.md §7 |
| **Performance тестирование** | Время ответа, нагрузка, кэширование | Intermediate | ARCHITECTURE.md §9 |
| **Межсервисное тестирование** | Saga, event contracts, consistency | Advanced | ARCHITECTURE.md §4.2 |
| **Баг-репорты** | Severity/Priority, шаги воспроизведения | Expert | — |

### 🚀 DevOps

| Навык | Требование | Уровень | Источник в архитектуре |
|-------|-----------|---------|----------------------|
| **Docker Compose** | Multi-service orchestration, volumes, networks, healthcheck | Expert | INFRASTRUCTURE.md §2 |
| **Docker** | Multi-stage builds, layer caching, non-root user | Expert | INFRASTRUCTURE.md §3 |
| **Kubernetes** | Deployments, Services, HPA, Ingress, ConfigMaps, Secrets | Advanced | INFRASTRUCTURE.md §5 |
| **GitHub Actions** | CI/CD pipelines, matrix builds, Docker registry | Advanced | INFRASTRUCTURE.md §6 |
| **Nginx** | Reverse proxy, rate limiting, auth_request, TLS | Expert | INFRASTRUCTURE.md §4 |
| **PostgreSQL** | pg_isready, pg_dump, connection pooling, read replicas | Advanced | INFRASTRUCTURE.md §2 |
| **Redis** | redis-cli, persistence, memory management | Advanced | — |
| **RabbitMQ** | Management API, queue management, DLQ | Intermediate | — |
| **Alembic** | Миграции в Docker контейнерах | Advanced | — |
| **Prometheus + Grafana** | Metrics, alerts, dashboards | Advanced | ARCHITECTURE.md §9.1 |
| **Loki** | Log aggregation, LogQL queries | Intermediate | ARCHITECTURE.md §9.2 |
| **OpenTelemetry** | Distributed tracing, Jaeger | Intermediate | ARCHITECTURE.md §9.3 |
| **SSL/TLS** | Certificate management, HTTPS configuration | Advanced | ARCHITECTURE.md §7.2 |
| **Мониторинг** | Health checks, log analysis, error patterns | Expert | SKILL_DEVOPS.md |

---

## 2. Матрица покрытия технологий

| Технология | Архитектор | Аналитик | Разработчик | Тестировщик | DevOps |
|-----------|-----------|----------|-------------|-------------|--------|
| Python 3.12+ | ● | ○ | ● | ● | ○ |
| FastAPI | ● | ○ | ● | ○ | ○ |
| SQLAlchemy 2.0 | ● | ○ | ● | ○ | ○ |
| PostgreSQL 16 | ● | ○ | ● | ○ | ● |
| Redis 7 | ● | ○ | ● | ○ | ● |
| RabbitMQ | ● | ○ | ● | ○ | ● |
| Docker | ● | ○ | ● | ○ | ● |
| Kubernetes | ● | ○ | ○ | ○ | ● |
| Nginx | ● | ○ | ○ | ○ | ● |
| JWT/OAuth | ● | ○ | ● | ○ | ○ |
| pytest | ○ | ○ | ● | ● | ○ |
| mypy/ruff | ○ | ○ | ● | ○ | ○ |
| Prometheus/Grafana | ● | ○ | ○ | ○ | ● |
| React/Next.js | ○ | ○ | ● | ○ | ○ |
| Celery 5 | ● | ○ | ● | ○ | ○ |
| GitHub Actions | ○ | ○ | ○ | ○ | ● |

● = требуется  ○ = не требуется

---

## 3. Критические навыки (блокеры)

Эти навыки критичны для проекта. Без них работа конвейера невозможна:

| Приоритет | Навык | Роль | Причина |
|-----------|-------|------|---------|
| P0 | FastAPI + Pydantic v2 | Разработчик | Основной фреймворк всех сервисов |
| P0 | SQLAlchemy 2.0 async | Разработчик | ORM для всех сервисов |
| P0 | Docker Compose | DevOps | Инфраструктура для разработки и продакшена |
| P0 | pytest | Разработчик + Тестировщик | Обязательные проверки качества |
| P1 | RabbitMQ (aio-pika) | Разработчик | Межсервисное взаимодействие |
| P1 | Nginx | DevOps | API Gateway |
| P1 | PostgreSQL | Разработчик + DevOps | БД каждого сервиса |
| P2 | Kubernetes | DevOps | Production оркестрация |
| P2 | Prometheus + Grafana | DevOps | Мониторинг |

---

## 4. Соответствие архитектурному заключению

| Требование архитектуры | Реализовано в конвейере | Соответствие |
|------------------------|------------------------|-------------|
| Database per Service | SKILL_ANALYST: указание сервиса в каждой задаче | ✅ |
| Saga (Choreography) | SKILL_ARCHITECT: проектирование Saga, ADR | ✅ |
| Outbox Pattern | SKILL_ARCHITECT: проектирование outbox_events | ✅ |
| CQRS | SKILL_ARCHITECT: разделение чтения/записи | ✅ |
| Circuit Breaker | .skill-developer: tenacity + circuitbreaker | ✅ |
| JWT + OAuth 2.0 | SKILL_ARCHITECT + .skill-developer: security layer | ✅ |
| RBAC (4 роли) | SKILL_ANALYST: указание ролей в User Stories | ✅ |
| API Gateway (Nginx) | SKILL_DEVOPS: конфигурация Nginx | ✅ |
| Healthcheck каждого сервиса | SKILL_DEVOPS: 10 endpoints healthcheck | ✅ |
| CI/CD GitHub Actions | SKILL_DEVOPS: pipeline automation | ✅ |
| Мониторинг (Prometheus + Grafana + Loki) | SKILL_DEVOPS: monitoring setup | ✅ |
| Structured Logging (structlog) | .skill-developer: logging conventions | ✅ |
| Трассировка (OpenTelemetry) | SKILL_DEVOPS + .skill-developer: tracing setup | ✅ |
| Docker multi-stage builds | SKILL_DEVOPS: production Dockerfile | ✅ |
| Rate Limiting (Nginx + Redis) | SKILL_DEVOPS: Nginx config | ✅ |
| Backward-compatible API | SKILL_ANALYST: версионирование API (v1) | ✅ |
| Alembic миграции | .skill-developer + SKILL_DEVOPS: миграции | ✅ |
| Фуллтекстовый поиск (PostgreSQL) | SKILL_ARCHITECT: GIN индексы | ✅ |
| Разделение B2C/B2B | SKILL_ANALYST: User Stories для сегментов | ✅ |

---

*Матрица навыков подготовлена на основе архитектурного заключения (ARCHITECTURE.md, DATABASE_SCHEMA.md, API_SPECIFICATION.md, INFRASTRUCTURE.md, DESIGN_BRIEF.md).*
