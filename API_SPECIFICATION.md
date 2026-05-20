# API Specification — DryClean Pro

## Общие принципы

### Базовый URL
```
Production:  https://api.dryclean-pro.ru
Development: http://localhost:8000
```

### Маршрутизация через API Gateway

| Префикс | Целевой сервис | Порт |
|---|---|---|
| `/api/v1/auth/*` | Auth Service | 8004 |
| `/api/v1/users/*` | User Service | 8001 |
| `/api/v1/catalog/*` | Catalog Service | 8003 |
| `/api/v1/orders/*` | Order Service | 8002 |
| `/api/v1/payments/*` | Payment Service | 8005 |
| `/api/v1/delivery/*` | Delivery Service | 8008 |
| `/api/v1/notifications/*` | Notification Service | 8007 |
| `/api/v1/loyalty/*` | Loyalty Service | 8010 |
| `/api/v1/reviews/*` | Review Service | 8009 |
| `/api/v1/pricing/*` | Pricing Service | 8006 |

### Общие заголовки

```
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
X-Request-Id: <uuid>          # Correlation ID для трейсинга
X-Idempotency-Key: <uuid>     # Идемпотентность POST-запросов
```

### Формат ответа

**Успех:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

**Ошибка:**
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Заказ не найден",
    "details": []
  }
}
```

### HTTP-коды ответов

| Код | Значение |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content (удаление) |
| 400 | Bad Request (ошибка валидации) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (дубликат) |
| 422 | Unprocessable Entity (Pydantic validation) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 1. Auth Service

### POST `/api/v1/auth/register`
Регистрация нового пользователя.

**Request:**
```json
{
  "phone": "+79991234567",
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "first_name": "Иван",
  "last_name": "Петров"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+79991234567",
    "email": "user@example.com"
  }
}
```

### POST `/api/v1/auth/login`
Авторизация по телефону/email + пароль.

**Request:**
```json
{
  "login": "+79991234567",
  "password": "SecureP@ss123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

### POST `/api/v1/auth/refresh`
Обновление access token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

### POST `/api/v1/auth/logout`
Инвалидация токена.

### POST `/api/v1/auth/verify-code`
Верификация SMS-кода.

**Request:**
```json
{
  "phone": "+79991234567",
  "code": "123456"
}
```

### POST `/api/v1/auth/reset-password`
Запрос на сброс пароля.

### POST `/api/v1/auth/oauth/telegram`
Авторизация через Telegram.

### POST `/api/v1/auth/oauth/google`
Авторизация через Google.

---

## 2. User Service

### GET `/api/v1/users/me`
Текущий профиль пользователя.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+79991234567",
    "email": "user@example.com",
    "first_name": "Иван",
    "last_name": "Петров",
    "avatar_url": "https://cdn.dryclean-pro.ru/avatars/...",
    "created_at": "2026-01-15T10:30:00Z",
    "loyalty_level": "silver"
  }
}
```

### PATCH `/api/v1/users/me`
Обновление профиля.

### GET `/api/v1/users/me/addresses`
Список адресов пользователя.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "addr-001",
      "label": "Дом",
      "address": "г. Москва, ул. Ленина, д. 10, кв. 5",
      "latitude": 55.7558,
      "longitude": 37.6173,
      "entrance": "2",
      "floor": "5",
      "is_default": true
    }
  ]
}
```

### POST `/api/v1/users/me/addresses`
Добавление адреса.

### PATCH `/api/v1/users/me/addresses/{address_id}`
Обновление адреса.

### DELETE `/api/v1/users/me/addresses/{address_id}`
Удаление адреса.

### GET `/api/v1/users/me/orders`
История заказов (проксирует к Order Service).

### GET `/api/v1/users/me/preferences`
Настройки уведомлений.

### PATCH `/api/v1/users/me/preferences`
Обновление настроек.

---

## 3. Catalog Service

### GET `/api/v1/catalog/categories`
Дерево категорий услуг.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-001",
      "name": "Химчистка одежды",
      "slug": "clothing",
      "icon_url": "https://cdn.dryclean-pro.ru/icons/clothing.svg",
      "services_count": 25,
      "children": [
        {
          "id": "cat-002",
          "name": "Верхняя одежда",
          "slug": "outerwear",
          "services_count": 8
        }
      ]
    },
    {
      "id": "cat-003",
      "name": "Химчистка мебели",
      "slug": "furniture",
      "services_count": 12
    },
    {
      "id": "cat-004",
      "name": "Химчистка ковров",
      "slug": "carpets",
      "services_count": 6
    }
  ]
}
```

### GET `/api/v1/catalog/categories/{category_id}/services`
Список услуг в категории.

### GET `/api/v1/catalog/services`
Все услуги (с фильтрацией).

**Query params:**
| Параметр | Тип | Описание |
|---|---|---|
| `category_id` | UUID | Фильтр по категории |
| `search` | string | Поиск по названию |
| `page` | int | Страница (default: 1) |
| `per_page` | int | На странице (default: 20) |

### GET `/api/v1/catalog/services/{service_id}`
Детальная информация об услуге.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "svc-001",
    "name": "Химчистка пальто",
    "description": "Профессиональная химчистка пальто...",
    "category": {
      "id": "cat-002",
      "name": "Верхняя одежда"
    },
    "base_price": 1500.00,
    "unit": "шт",
    "estimated_time_hours": 48,
    "image_url": "https://cdn.dryclean-pro.ru/services/coat.jpg",
    "fabric_types": [
      {"id": "fab-001", "name": "Шерсть"},
      {"id": "fab-002", "name": "Кашемир"}
    ],
    "price_modifiers": [
      {"fabric_type": "Кашемир", "modifier": 1.3, "reason": "Деликатная обработка"}
    ]
  }
}
```

### GET `/api/v1/catalog/fabrics`
Список типов тканей.

### GET `/api/v1/catalog/services/{service_id}/calculate`
Предварительный расчёт стоимости.

**Query params:**
| Параметр | Тип | Описание |
|---|---|---|
| `fabric_type_id` | UUID | Тип ткани |
| `quantity` | int | Количество |
| `urgency` | bool | Срочная обработка |

---

## 4. Order Service

### POST `/api/v1/orders`
Создание заказа.

**Request:**
```json
{
  "items": [
    {
      "service_id": "svc-001",
      "fabric_type_id": "fab-001",
      "quantity": 2,
      "notes": "Пятно на рукаве"
    },
    {
      "service_id": "svc-005",
      "fabric_type_id": "fab-003",
      "quantity": 1,
      "notes": null
    }
  ],
  "pickup_address_id": "addr-001",
  "delivery_address_id": "addr-001",
  "pickup_slot_id": "slot-045",
  "delivery_slot_id": "slot-089",
  "promocode": "CLEAN20",
  "payment_method": "card",
  "notes": "Домофон не работает, звоните по телефону"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "ord-20260115-0001",
    "status": "NEW",
    "items": [
      {
        "id": "item-001",
        "service_name": "Химчистка пальто",
        "fabric_type": "Шерсть",
        "quantity": 2,
        "unit_price": 1500.00,
        "total_price": 3000.00,
        "notes": "Пятно на рукаве"
      }
    ],
    "subtotal": 4500.00,
    "discount": 900.00,
    "delivery_fee": 0.00,
    "total": 3600.00,
    "pickup": {
      "address": "г. Москва, ул. Ленина, д. 10, кв. 5",
      "slot": "2026-01-16T10:00:00Z — 14:00:00Z"
    },
    "delivery": {
      "address": "г. Москва, ул. Ленина, д. 10, кв. 5",
      "slot": "2026-01-19T10:00:00Z — 14:00:00Z"
    },
    "created_at": "2026-01-15T10:30:00Z",
    "estimated_completion": "2026-01-19T14:00:00Z"
  }
}
```

### GET `/api/v1/orders`
Список заказов пользователя.

**Query params:**
| Параметр | Тип | Описание |
|---|---|---|
| `status` | string | Фильтр по статусу |
| `from_date` | date | С даты |
| `to_date` | date | По дату |
| `page` | int | Страница |
| `per_page` | int | На странице |

### GET `/api/v1/orders/{order_id}`
Детали заказа.

### PATCH `/api/v1/orders/{order_id}/cancel`
Отмена заказа.

### POST `/api/v1/orders/{order_id}/status`
Обновление статуса (внутренний API для операторов/курьеров).

**Request:**
```json
{
  "status": "PROCESSING",
  "comment": "Передано в цех"
}
```

### GET `/api/v1/orders/{order_id}/timeline`
История изменения статусов.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "status": "NEW",
      "changed_at": "2026-01-15T10:30:00Z",
      "changed_by": "system",
      "comment": null
    },
    {
      "status": "CONFIRMED",
      "changed_at": "2026-01-15T10:31:00Z",
      "changed_by": "operator-001",
      "comment": "Заказ подтверждён"
    }
  ]
}
```

### GET `/api/v1/orders/{order_id}/track`
Трекинг заказа в реальном времени (WebSocket fallback).

---

## 5. Payment Service

### POST `/api/v1/payments/initiate`
Инициация платежа.

**Request:**
```json
{
  "order_id": "ord-20260115-0001",
  "amount": 3600.00,
  "method": "card",
  "return_url": "https://dryclean-pro.ru/orders/ord-20260115-0001"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay-001",
    "status": "pending",
    "confirmation_url": "https://yookassa.ru/...",
    "amount": 3600.00,
    "expires_at": "2026-01-15T10:45:00Z"
  }
}
```

### GET `/api/v1/payments/{payment_id}`
Статус платежа.

### POST `/api/v1/payments/{payment_id}/refund`
Возврат.

**Request:**
```json
{
  "amount": 3600.00,
  "reason": "ORDER_CANCELLED"
}
```

### POST `/api/v1/payments/webhook`
Webhook от платёжной системы (внутренний).

---

## 6. Delivery Service

### GET `/api/v1/delivery/slots`
Доступные временные слоты.

**Query params:**
| Параметр | Тип | Описание |
|---|---|---|
| `address_id` | UUID | Адрес доставки |
| `date_from` | date | С даты |
| `date_to` | date | По дату |
| `type` | string | `pickup` / `delivery` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "slot-045",
      "date": "2026-01-16",
      "time_from": "10:00",
      "time_to": "14:00",
      "available": true,
      "price": 0.00
    },
    {
      "id": "slot-046",
      "date": "2026-01-16",
      "time_from": "14:00",
      "time_to": "18:00",
      "available": false,
      "price": 0.00
    },
    {
      "id": "slot-047",
      "date": "2026-01-16",
      "time_from": "18:00",
      "time_to": "22:00",
      "available": true,
      "price": 150.00
    }
  ]
}
```

### GET `/api/v1/delivery/orders/{order_id}/track`
Гео-трекинг курьера.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "courier_name": "Алексей",
    "courier_phone": "+7999***1234",
    "current_location": {
      "latitude": 55.7560,
      "longitude": 37.6180
    },
    "eta_minutes": 15,
    "status": "on_the_way"
  }
}
```

### GET `/api/v1/delivery/couriers` (admin)
Список курьеров и их статус.

### PATCH `/api/v1/delivery/couriers/{courier_id}/location`
Обновление гео-позиции курьера.

---

## 7. Notification Service

### GET `/api/v1/notifications`
Список уведомлений пользователя.

### PATCH `/api/v1/notifications/{notification_id}/read`
Пометить как прочитанное.

### POST `/api/v1/notifications/device-token`
Регистрация push-token устройства.

**Request:**
```json
{
  "token": "firebase-device-token-...",
  "platform": "ios"
}
```

### DELETE `/api/v1/notifications/device-token`
Удаление push-token.

---

## 8. Loyalty Service

### GET `/api/v1/loyalty/account`
Бонусный счёт пользователя.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "level": "silver",
    "points_balance": 2500,
    "points_total_earned": 8500,
    "next_level": "gold",
    "points_to_next_level": 1500,
    "benefits": {
      "discount_percent": 5,
      "free_delivery_monthly": 2,
      "priority_support": false
    }
  }
}
```

### GET `/api/v1/loyalty/transactions`
История начисления/списания баллов.

### POST `/api/v1/loyalty/redeem`
Списание баллов.

### POST `/api/v1/loyalty/referral`
Генерация реферальной ссылки.

### GET `/api/v1/loyalty/promocode/validate`
Валидация промокода.

**Query params:**
| Параметр | Тип | Описание |
|---|---|---|
| `code` | string | Промокод |
| `order_amount` | float | Сумма заказа |

---

## 9. Review Service

### GET `/api/v1/reviews`
Отзывы (публичные).

**Query params:**
| Параметр | Тип | Описание |
|---|---|---|
| `service_id` | UUID | По услуге |
| `rating` | int | По рейтингу (1-5) |
| `page` | int | Страница |

### POST `/api/v1/reviews`
Создание отзыва (только для завершённых заказов).

**Request:**
```json
{
  "order_id": "ord-20260115-0001",
  "rating": 5,
  "comment": "Отличное качество, верну как новое!",
  "service_ratings": [
    {"service_id": "svc-001", "rating": 5},
    {"service_id": "svc-005", "rating": 4}
  ]
}
```

### PATCH `/api/v1/reviews/{review_id}`
Редактирование отзыва.

### DELETE `/api/v1/reviews/{review_id}`
Удаление отзыва.

### POST `/api/v1/reviews/{review_id}/response` (admin)
Ответ администратора на отзыв.

---

## 10. Admin API

Все admin-эндпоинты требуют роль `admin` или `operator`.

### GET `/api/v1/admin/orders`
Все заказы (с фильтрацией).

### PATCH `/api/v1/admin/orders/{order_id}/assign`
Назначить оператора/курьера на заказ.

### GET `/api/v1/admin/dashboard/stats`
Статистика дашборда.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "orders_today": 45,
    "revenue_today": 125000.00,
    "orders_in_progress": 120,
    "average_order_value": 2800.00,
    "customer_satisfaction": 4.7,
    "couriers_active": 8
  }
}
```

### CRUD операции:
- `/api/v1/admin/services` — управление услугами
- `/api/v1/admin/categories` — управление категориями
- `/api/v1/admin/couriers` — управление курьерами
- `/api/v1/admin/operators` — управление операторами
- `/api/v1/admin/promocodes` — управление промокодами
- `/api/v1/admin/delivery-slots` — управление слотами

---

## События RabbitMQ (Async API)

### Exchange: `dryclean.events` (Topic)

| Routing Key | Publisher | Consumer | Payload |
|---|---|---|---|
| `order.created` | Order Service | Pricing, Notification | `{order_id, user_id, items}` |
| `order.status_changed` | Order Service | Notification, Loyalty | `{order_id, old_status, new_status}` |
| `order.cancelled` | Order Service | Payment, Delivery, Notification | `{order_id, reason}` |
| `payment.completed` | Payment Service | Order, Loyalty | `{order_id, payment_id, amount}` |
| `payment.failed` | Payment Service | Order, Notification | `{order_id, reason}` |
| `payment.refunded` | Payment Service | Order, Loyalty | `{order_id, amount}` |
| `delivery.courier_assigned` | Delivery Service | Order, Notification | `{order_id, courier_id}` |
| `delivery.courier_location` | Delivery Service | — (WebSocket) | `{courier_id, lat, lng}` |
| `loyalty.points_earned` | Loyalty Service | Notification | `{user_id, points, reason}` |
| `user.registered` | User Service | Loyalty, Notification | `{user_id, phone, email}` |
