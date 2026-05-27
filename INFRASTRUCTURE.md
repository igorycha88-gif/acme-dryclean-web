# Инфраструктура и развёртывание — DryClean Pro

## 1. Окружения

| Окружение | Цель | URL |
|---|---|---|
| **Local** | Разработка на локальной машине | localhost |
| **Dev** | Совместная разработка и тестирование | dev.dryclean-pro.ru |
| **Staging** | Предпродуктивное тестирование | staging.dryclean-pro.ru |
| **Production** | Боевое окружение | dryclean-pro.ru |

---

## 2. Локальная разработка (Docker Compose)

### docker-compose.dev.yml

```yaml
version: "3.9"

services:
  # === Infrastructure ===
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dryclean
      POSTGRES_PASSWORD: dryclean_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dryclean"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: dryclean
      RABBITMQ_DEFAULT_PASS: dryclean_dev
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # === API Gateway ===
  gateway:
    build:
      context: ./services/gateway
      dockerfile: Dockerfile
    ports:
      - "8000:80"
    depends_on:
      - user-service
      - auth-service
      - order-service
      - catalog-service
      - payment-service
      - notification-service
      - delivery-service
      - loyalty-service
      - review-service
      - pricing-service
    volumes:
      - ./services/gateway/nginx.dev.conf:/etc/nginx/nginx.conf

  # === Microservices ===
  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/users_db
      REDIS_URL: redis://redis:6379/1
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
      JWT_SECRET: dev-secret-key-change-in-prod
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      rabbitmq:
        condition: service_started
    volumes:
      - ./services/user-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/auth_db
      REDIS_URL: redis://redis:6379/2
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
      JWT_SECRET: dev-secret-key-change-in-prod
      JWT_ACCESS_EXPIRE_MINUTES: 15
      JWT_REFRESH_EXPIRE_DAYS: 7
    ports:
      - "8004:8004"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/auth-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8004 --reload

  order-service:
    build:
      context: ./services/order-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/orders_db
      REDIS_URL: redis://redis:6379/3
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
      JWT_SECRET: dev-secret-key-change-in-prod
    ports:
      - "8002:8002"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/order-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload

  catalog-service:
    build:
      context: ./services/catalog-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/catalog_db
      REDIS_URL: redis://redis:6379/4
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
    ports:
      - "8003:8003"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/catalog-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload

  payment-service:
    build:
      context: ./services/payment-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/payments_db
      REDIS_URL: redis://redis:6379/5
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
    ports:
      - "8005:8005"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/payment-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload

  notification-service:
    build:
      context: ./services/notification-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/notifications_db
      REDIS_URL: redis://redis:6379/6
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
      SMTP_HOST: smtp.example.com
      SMTP_PORT: 587
      SMTP_USER: ""
      SMTP_PASSWORD: ""
    ports:
      - "8007:8007"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/notification-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8007 --reload

  delivery-service:
    build:
      context: ./services/delivery-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/delivery_db
      REDIS_URL: redis://redis:6379/7
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
    ports:
      - "8008:8008"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/delivery-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload

  loyalty-service:
    build:
      context: ./services/loyalty-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/loyalty_db
      REDIS_URL: redis://redis:6379/8
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
    ports:
      - "8010:8010"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/loyalty-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload

  review-service:
    build:
      context: ./services/review-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/reviews_db
      REDIS_URL: redis://redis:6379/9
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
    ports:
      - "8009:8009"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/review-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8009 --reload

  pricing-service:
    build:
      context: ./services/pricing-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/pricing_db
      REDIS_URL: redis://redis:6379/10
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
    ports:
      - "8006:8006"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/pricing-service:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8006 --reload

  # === Celery Workers ===
  celery-worker-notification:
    build:
      context: ./services/notification-service
      dockerfile: Dockerfile
    command: celery -A app.celery_app worker -Q notification -l info -c 4
    environment:
      DATABASE_URL: postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/notifications_db
      RABBITMQ_URL: amqp://dryclean:dryclean_dev@rabbitmq:5672/
    depends_on:
      - rabbitmq
      - postgres

  # === Monitoring (dev) ===
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@dryclean.pro
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

### init-databases.sql

```sql
CREATE DATABASE users_db;
CREATE DATABASE auth_db;
CREATE DATABASE orders_db;
CREATE DATABASE catalog_db;
CREATE DATABASE payments_db;
CREATE DATABASE delivery_db;
CREATE DATABASE notifications_db;
CREATE DATABASE pricing_db;
CREATE DATABASE loyalty_db;
CREATE DATABASE reviews_db;
```

---

## 3. Dockerfile (шаблон для сервиса)

```dockerfile
FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock* ./

RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Multi-stage production Dockerfile

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

FROM python:3.12-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## 4. Nginx — API Gateway конфигурация

```nginx
upstream user_service {
    server user-service:8001;
}
upstream auth_service {
    server auth-service:8004;
}
upstream order_service {
    server order-service:8002;
}
upstream catalog_service {
    server catalog-service:8003;
}
upstream payment_service {
    server payment-service:8005;
}
upstream delivery_service {
    server delivery-service:8008;
}
upstream notification_service {
    server notification-service:8007;
}
upstream loyalty_service {
    server loyalty-service:8010;
}
upstream review_service {
    server review-service:8009;
}
upstream pricing_service {
    server pricing-service:8006;
}

server {
    listen 80;
    server_name api.dryclean-pro.ru;

    client_max_body_size 10M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req zone=api burst=60 nodelay;

    # Auth routes (public)
    location /api/v1/auth/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-Id $request_id;
    }

    # Catalog (mostly public, cached)
    location /api/v1/catalog/ {
        proxy_pass http://catalog_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-Id $request_id;

        proxy_cache_valid 200 5m;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # All other API routes (require auth)
    location /api/v1/users/ {
        auth_request /auth/validate;
        proxy_pass http://user_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-User-Id $upstream_http_x_user_id;
        proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/orders/ {
        auth_request /auth/validate;
        proxy_pass http://order_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-User-Id $upstream_http_x_user_id;
        proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/payments/ {
        auth_request /auth/validate;
        proxy_pass http://payment_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-User-Id $upstream_http_x_user_id;
        proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/delivery/ {
        auth_request /auth/validate;
        proxy_pass http://delivery_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-User-Id $upstream_http_x_user_id;
        proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/notifications/ {
        auth_request /auth/validate;
        proxy_pass http://notification_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-User-Id $upstream_http_x_user_id;
        proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/loyalty/ {
        auth_request /auth/validate;
        proxy_pass http://loyalty_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-User-Id $upstream_http_x_user_id;
        proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/reviews/ {
        proxy_pass http://review_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/pricing/ {
        auth_request /auth/validate;
        proxy_pass http://pricing_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-User-Id $upstream_http_x_user_id;
        proxy_set_header X-Request-Id $request_id;
    }

    # Internal auth validation endpoint
    location = /auth/validate {
        internal;
        proxy_pass http://auth_service/api/v1/auth/validate;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header Authorization $http_authorization;
    }

    # Health check
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }
}
```

---

## 5. Kubernetes (Production)

### Структура манифестов

```
k8s/
├── namespace.yaml
├── configmap.yaml
├── secrets.yaml             # sealed-secrets в проде
├── gateway/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── user-service/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── auth-service/
│   └── ...
├── order-service/
│   └── ...
├── ... (на каждый сервис)
├── infrastructure/
│   ├── postgres/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml
│   ├── redis/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   └── rabbitmq/
│       ├── statefulset.yaml
│       └── service.yaml
└── monitoring/
    ├── prometheus/
    │   ├── configmap.yaml
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── grafana/
    │   ├── deployment.yaml
    │   └── service.yaml
    └── loki/
        └── ...
```

### Пример Deployment (order-service)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: dryclean
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-service
          image: drycleanpro/order-service:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: order-service-secrets
                  key: database-url
            - name: RABBITMQ_URL
              valueFrom:
                secretKeyRef:
                  name: infra-secrets
                  key: rabbitmq-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: infra-secrets
                  key: redis-url
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
  namespace: dryclean
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 6. CI/CD (GitHub Actions)

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - user-service
          - auth-service
          - order-service
          - catalog-service
          - payment-service
          - notification-service
          - delivery-service
          - loyalty-service
          - review-service
          - pricing-service
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          cd services/${{ matrix.service }}
          pip install poetry
          poetry install

      - name: Lint (ruff)
        run: |
          cd services/${{ matrix.service }}
          poetry run ruff check .

      - name: Type check (mypy)
        run: |
          cd services/${{ matrix.service }}
          poetry run mypy app/

      - name: Run tests
        run: |
          cd services/${{ matrix.service }}
          poetry run pytest tests/ -v --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: services/${{ matrix.service }}/coverage.xml
          flags: ${{ matrix.service }}

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    strategy:
      matrix:
        service:
          - user-service
          - auth-service
          - order-service
          - catalog-service
          - payment-service
          - notification-service
          - delivery-service
          - loyalty-service
          - review-service
          - pricing-service
          - gateway
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./services/${{ matrix.service }}
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}/${{ matrix.service }}:latest
```

---

## 7. Конфигурация сервиса (Pydantic Settings)

Шаблон `app/config.py` для каждого сервиса:

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "dryclean-service"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    REDIS_URL: str
    REDIS_CACHE_TTL: int = 300

    RABBITMQ_URL: str
    RABBITMQ_EXCHANGE: str = "dryclean.events"

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

---

## 8. Команды для начала работы

```bash
# Клонирование и запуск
git clone https://github.com/org/dryclean-pro.git
cd dryclean-pro

# Запуск всей инфраструктуры
docker compose -f docker-compose.dev.yml up -d

# Запуск миграций (для каждого сервиса)
docker compose -f docker-compose.dev.yml exec user-service alembic upgrade head
docker compose -f docker-compose.dev.yml exec auth-service alembic upgrade head
docker compose -f docker-compose.dev.yml exec order-service alembic upgrade head
# ... и т.д.

# Запуск тестов
docker compose -f docker-compose.dev.yml exec order-service pytest tests/ -v

# Просмотр логов
docker compose -f docker-compose.dev.yml logs -f order-service

# Остановка
docker compose -f docker-compose.dev.yml down
```

---

## 9. Рекомендуемые ресурсы для Production

| Ресурс | Рекомендация | Min для старта |
|---|---|---|
| **CPU** | 2-4 ядра на сервис | 8 vCPU total |
| **RAM** | 256-512 MB на сервис | 8 GB total |
| **PostgreSQL** | Managed (RDS/CloudSQL) | 2 vCPU, 4 GB |
| **Redis** | Managed (ElastiCache) | 1 GB |
| **RabbitMQ** | Managed или self-hosted | 1 vCPU, 2 GB |
| **Storage** | S3/MinIO для файлов | 10 GB |
| **S3 CDN** | CloudFlare / CloudFront | — |
