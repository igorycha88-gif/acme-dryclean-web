# Схема базы данных — DryClean Pro

## Принципы проектирования БД

- **Database per Service** — каждый микросервис имеет собственную БД
- **UUID** как первичные ключи (для распределённости)
- **Soft delete** через `deleted_at` для критичных сущностей
- **Timestamps**: `created_at`, `updated_at` на всех таблицах
- **JSONB** для гибких данных (метаданные, настройки)
- **PostGIS** для гео-данных в Delivery Service

---

## 1. User Service Database: `users_db`

### 1.1 Таблица `users`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Идентификатор |
| `phone` | VARCHAR(20) | UNIQUE, NOT NULL | Телефон (E.164) |
| `email` | VARCHAR(255) | UNIQUE | Email |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt хеш |
| `first_name` | VARCHAR(100) | NOT NULL | Имя |
| `last_name` | VARCHAR(100) | | Фамилия |
| `avatar_url` | TEXT | | URL аватара |
| `is_active` | BOOLEAN | DEFAULT true | Активен |
| `is_phone_verified` | BOOLEAN | DEFAULT false | Телефон подтверждён |
| `is_email_verified` | BOOLEAN | DEFAULT false | Email подтверждён |
| `last_login_at` | TIMESTAMPTZ | | Последний вход |
| `metadata` | JSONB | DEFAULT '{}' | Гибкие данные |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Создан |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Обновлён |
| `deleted_at` | TIMESTAMPTZ | | Удалён (soft delete) |

**Индексы:**
- `idx_users_phone` — UNIQUE на `phone`
- `idx_users_email` — UNIQUE на `email` WHERE `email IS NOT NULL`
- `idx_users_created_at` — на `created_at`

### 1.2 Таблица `addresses`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `user_id` | UUID | FK → users.id, NOT NULL | Владелец |
| `label` | VARCHAR(50) | NOT NULL | Метка (Дом, Работа) |
| `address` | TEXT | NOT NULL | Полный адрес |
| `city` | VARCHAR(100) | NOT NULL | Город |
| `street` | VARCHAR(255) | | Улица |
| `building` | VARCHAR(20) | | Дом |
| `apartment` | VARCHAR(20) | | Квартира |
| `entrance` | VARCHAR(10) | | Подъезд |
| `floor` | VARCHAR(10) | | Этаж |
| `latitude` | DECIMAL(10,8) | | Широта |
| `longitude` | DECIMAL(11,8) | | Долгота |
| `is_default` | BOOLEAN | DEFAULT false | Основной адрес |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_addresses_user_id` — на `user_id`
- `idx_addresses_location` — GiST индекс на (latitude, longitude) для гео-поиска

### 1.3 Таблица `user_preferences`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, UNIQUE | Пользователь |
| `notify_sms` | BOOLEAN | DEFAULT true | SMS уведомления |
| `notify_email` | BOOLEAN | DEFAULT true | Email уведомления |
| `notify_push` | BOOLEAN | DEFAULT true | Push уведомления |
| `notify_telegram` | BOOLEAN | DEFAULT false | Telegram уведомления |
| `language` | VARCHAR(5) | DEFAULT 'ru' | Язык интерфейса |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 2. Auth Service Database: `auth_db`

### 2.1 Таблица `roles`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | client, operator, courier, admin |
| `description` | TEXT | | Описание роли |
| `permissions` | JSONB | NOT NULL | Список разрешений |

### 2.2 Таблица `user_roles`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `user_id` | UUID | FK, NOT NULL | ID пользователя (из User Service) |
| `role_id` | UUID | FK → roles.id, NOT NULL | Роль |
| `granted_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**PK:** (`user_id`, `role_id`)

### 2.3 Таблица `refresh_tokens`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL | Пользователь |
| `token_hash` | VARCHAR(255) | UNIQUE, NOT NULL | Хеш refresh token |
| `device_info` | VARCHAR(255) | | Информация об устройстве |
| `ip_address` | INET | | IP создания |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Срок действия |
| `revoked_at` | TIMESTAMPTZ | | Отозван |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_refresh_tokens_user_id` — на `user_id`
- `idx_refresh_tokens_expires` — на `expires_at` (для cleanup)

### 2.4 Таблица `oauth_accounts`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL | Пользователь |
| `provider` | VARCHAR(50) | NOT NULL | google, telegram, apple |
| `provider_user_id` | VARCHAR(255) | NOT NULL | ID у провайдера |
| `access_token` | TEXT | | OAuth access token |
| `metadata` | JSONB | DEFAULT '{}' | Данные от провайдера |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique:** (`provider`, `provider_user_id`)

---

## 3. Catalog Service Database: `catalog_db`

### 3.1 Таблица `categories`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `parent_id` | UUID | FK → categories.id | Родительская категория |
| `name` | VARCHAR(255) | NOT NULL | Название |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-слаг |
| `description` | TEXT | | Описание |
| `icon_url` | TEXT | | Иконка |
| `sort_order` | INTEGER | DEFAULT 0 | Порядок сортировки |
| `is_active` | BOOLEAN | DEFAULT true | Активна |
| `seo_title` | VARCHAR(255) | | SEO заголовок |
| `seo_description` | TEXT | | SEO описание |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_categories_parent_id` — на `parent_id`
- `idx_categories_slug` — UNIQUE на `slug`

### 3.2 Таблица `services`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `category_id` | UUID | FK → categories.id, NOT NULL | Категория |
| `name` | VARCHAR(255) | NOT NULL | Название услуги |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-слаг |
| `description` | TEXT | | Описание |
| `base_price` | DECIMAL(10,2) | NOT NULL | Базовая цена |
| `unit` | VARCHAR(20) | DEFAULT 'шт' | Единица измерения |
| `estimated_time_hours` | INTEGER | NOT NULL | Срок выполнения (часы) |
| `image_url` | TEXT | | Изображение |
| `is_popular` | BOOLEAN | DEFAULT false | Популярная |
| `is_active` | BOOLEAN | DEFAULT true | Активна |
| `sort_order` | INTEGER | DEFAULT 0 | Сортировка |
| `metadata` | JSONB | DEFAULT '{}' | Гибкие данные |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_services_category_id` — на `category_id`
- `idx_services_active` — на `is_active, sort_order`
- `idx_services_search` — GIN на `to_tsvector('russian', name || ' ' || description)` для полнотекстового поиска

### 3.3 Таблица `fabric_types`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Название ткани |
| `description` | TEXT | | Описание |
| `care_instructions` | TEXT | | Инструкция по уходу |
| `is_active` | BOOLEAN | DEFAULT true | |

### 3.4 Таблица `service_fabric_prices`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `service_id` | UUID | FK → services.id, NOT NULL | Услуга |
| `fabric_type_id` | UUID | FK → fabric_types.id, NOT NULL | Ткань |
| `price_modifier` | DECIMAL(5,2) | NOT NULL | Множитель цены (1.0 = базовая) |
| `additional_time_hours` | INTEGER | DEFAULT 0 | Доп. время |
| `notes` | TEXT | | Примечание |

**Unique:** (`service_id`, `fabric_type_id`)

---

## 4. Order Service Database: `orders_db`

### 4.1 Таблица `orders`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `order_number` | VARCHAR(20) | UNIQUE, NOT NULL | Человекочитаемый номер |
| `user_id` | UUID | NOT NULL | ID клиента (из User Service) |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'NEW' | Статус (FSM) |
| `subtotal` | DECIMAL(10,2) | NOT NULL | Сумма без скидок |
| `discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Скидка |
| `delivery_fee` | DECIMAL(10,2) | DEFAULT 0 | Стоимость доставки |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Итого |
| `currency` | VARCHAR(3) | DEFAULT 'RUB' | Валюта |
| `pickup_address` | JSONB | NOT NULL | Адрес забора (snapshot) |
| `delivery_address` | JSONB | NOT NULL | Адрес доставки (snapshot) |
| `pickup_slot_id` | UUID | | Временной слот забора |
| `delivery_slot_id` | UUID | | Временной слот доставки |
| `pickup_at` | TIMESTAMPTZ | | Время забора (факт) |
| `delivery_at` | TIMESTAMPTZ | | Время доставки (факт) |
| `assigned_operator_id` | UUID | | Оператор |
| `assigned_courier_id` | UUID | | Курьер |
| `promocode_id` | UUID | | Использованный промокод |
| `payment_id` | UUID | | ID платежа (из Payment Service) |
| `payment_method` | VARCHAR(30) | | Способ оплаты |
| `payment_status` | VARCHAR(30) | DEFAULT 'PENDING' | Статус оплаты |
| `notes` | TEXT | | Примечание клиента |
| `internal_notes` | TEXT | | Внутренние заметки |
| `completed_at` | TIMESTAMPTZ | | Завершён |
| `cancelled_at` | TIMESTAMPTZ | | Отменён |
| `cancellation_reason` | TEXT | | Причина отмены |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_orders_user_id` — на `user_id`
- `idx_orders_status` — на `status`
- `idx_orders_created_at` — на `created_at` DESC
- `idx_orders_number` — UNIQUE на `order_number`
- `idx_orders_assigned` — на `assigned_operator_id, assigned_courier_id`

**Partitioning:** по RANGE(`created_at`) — по месяцам

### 4.2 Таблица `order_items`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `order_id` | UUID | FK → orders.id, NOT NULL | Заказ |
| `service_id` | UUID | NOT NULL | Услуга (из Catalog Service) |
| `service_name` | VARCHAR(255) | NOT NULL | Название услуги (snapshot) |
| `fabric_type_id` | UUID | | Тип ткани |
| `fabric_type_name` | VARCHAR(100) | | Название ткани (snapshot) |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Количество |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Цена за единицу |
| `total_price` | DECIMAL(10,2) | NOT NULL | Итого за позицию |
| `notes` | TEXT | | Примечание клиента |
| `status` | VARCHAR(30) | DEFAULT 'PENDING' | Статус позиции |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_order_items_order_id` — на `order_id`

### 4.3 Таблица `order_status_history`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `order_id` | UUID | FK → orders.id, NOT NULL | Заказ |
| `from_status` | VARCHAR(30) | | Предыдущий статус |
| `to_status` | VARCHAR(30) | NOT NULL | Новый статус |
| `changed_by_id` | UUID | | Кто изменил |
| `changed_by_type` | VARCHAR(20) | | system, operator, courier, client |
| `comment` | TEXT | | Комментарий |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_status_history_order_id` — на `order_id, created_at`

### 4.4 Таблица `outbox_events`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `aggregate_type` | VARCHAR(50) | NOT NULL | Тип агрегата (order) |
| `aggregate_id` | UUID | NOT NULL | ID агрегата |
| `event_type` | VARCHAR(100) | NOT NULL | Тип события |
| `payload` | JSONB | NOT NULL | Данные события |
| `published` | BOOLEAN | DEFAULT false | Опубликовано |
| `published_at` | TIMESTAMPTZ | | Дата публикации |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_outbox_unpublished` — на `published` WHERE `published = false`
- `idx_outbox_created_at` — на `created_at`

---

## 5. Payment Service Database: `payments_db`

### 5.1 Таблица `payments`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `order_id` | UUID | NOT NULL | ID заказа |
| `user_id` | UUID | NOT NULL | Клиент |
| `amount` | DECIMAL(10,2) | NOT NULL | Сумма |
| `currency` | VARCHAR(3) | DEFAULT 'RUB' | Валюта |
| `method` | VARCHAR(30) | NOT NULL | card, sbp, wallet |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'PENDING' | pending, completed, failed, refunded |
| `provider` | VARCHAR(50) | NOT NULL | yookassa, tinkoff, sberpay |
| `provider_payment_id` | VARCHAR(255) | | ID у провайдера |
| `provider_response` | JSONB | | Ответ провайдера |
| `metadata` | JSONB | DEFAULT '{}' | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_payments_order_id` — на `order_id`
- `idx_payments_user_id` — на `user_id`
- `idx_payments_status` — на `status`

### 5.2 Таблица `refunds`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `payment_id` | UUID | FK → payments.id, NOT NULL | Платёж |
| `amount` | DECIMAL(10,2) | NOT NULL | Сумма возврата |
| `reason` | VARCHAR(100) | NOT NULL | Причина |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'PENDING' | pending, completed, failed |
| `provider_refund_id` | VARCHAR(255) | | ID у провайдера |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 6. Delivery Service Database: `delivery_db`

### 6.1 Таблица `couriers`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | UNIQUE, NOT NULL | ID пользователя |
| `first_name` | VARCHAR(100) | NOT NULL | Имя |
| `last_name` | VARCHAR(100) | | Фамилия |
| `phone` | VARCHAR(20) | NOT NULL | Телефон |
| `status` | VARCHAR(20) | DEFAULT 'OFFLINE' | online, offline, busy |
| `vehicle_type` | VARCHAR(20) | | car, bike, foot |
| `current_latitude` | DECIMAL(10,8) | | Широта |
| `current_longitude` | DECIMAL(11,8) | | Долгота |
| `location_updated_at` | TIMESTAMPTZ | | Время обновления гео |
| `rating` | DECIMAL(3,2) | DEFAULT 5.00 | Рейтинг |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### 6.2 Таблица `delivery_slots`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `date` | DATE | NOT NULL | Дата |
| `time_from` | TIME | NOT NULL | Начало слота |
| `time_to` | TIME | NOT NULL | Конец слота |
| `type` | VARCHAR(10) | NOT NULL | pickup, delivery |
| `max_orders` | INTEGER | DEFAULT 10 | Максимум заказов |
| `current_orders` | INTEGER | DEFAULT 0 | Текущее кол-во |
| `price` | DECIMAL(10,2) | DEFAULT 0 | Стоимость слота |
| `is_available` | BOOLEAN | DEFAULT true | Доступен |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_slots_date_type` — на `date, type, is_available`

### 6.3 Таблица `courier_location_log`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `courier_id` | UUID | NOT NULL | Курьер |
| `latitude` | DECIMAL(10,8) | NOT NULL | |
| `longitude` | DECIMAL(11,8) | NOT NULL | |
| `battery_level` | INTEGER | | Уровень батареи |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Индексы:**
- `idx_courier_location_courier_time` — на `courier_id, created_at DESC`

**Partitioning:** по RANGE(`created_at`) — по дням (log-данные)

---

## 7. Pricing Service Database: `pricing_db`

### 7.1 Таблица `price_rules`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `name` | VARCHAR(255) | NOT NULL | Название правила |
| `rule_type` | VARCHAR(30) | NOT NULL | urgency, volume, loyalty, seasonal |
| `condition` | JSONB | NOT NULL | Условие применения |
| `modifier_type` | VARCHAR(10) | NOT NULL | percent, fixed |
| `modifier_value` | DECIMAL(10,2) | NOT NULL | Значение |
| `priority` | INTEGER | DEFAULT 0 | Приоритет (выше = раньше) |
| `starts_at` | TIMESTAMPTZ | | Начало действия |
| `ends_at` | TIMESTAMPTZ | | Конец действия |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### 7.2 Таблица `promocodes`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `code` | VARCHAR(30) | UNIQUE, NOT NULL | Код |
| `description` | TEXT | | Описание |
| `discount_type` | VARCHAR(10) | NOT NULL | percent, fixed |
| `discount_value` | DECIMAL(10,2) | NOT NULL | Значение скидки |
| `min_order_amount` | DECIMAL(10,2) | DEFAULT 0 | Мин. сумма заказа |
| `max_discount` | DECIMAL(10,2) | | Макс. скидка |
| `usage_limit` | INTEGER | | Лимит использований |
| `used_count` | INTEGER | DEFAULT 0 | Использовано |
| `per_user_limit` | INTEGER | DEFAULT 1 | Лимит на пользователя |
| `starts_at` | TIMESTAMPTZ | | Начало |
| `ends_at` | TIMESTAMPTZ | | Конец |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 8. Notification Service Database: `notifications_db`

### 8.1 Таблица `notification_templates`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `event_type` | VARCHAR(100) | UNIQUE, NOT NULL | Тип события |
| `channel` | VARCHAR(20) | NOT NULL | sms, email, push, telegram |
| `subject_template` | TEXT | | Шаблон темы (email) |
| `body_template` | TEXT | NOT NULL | Шаблон тела (Jinja2) |
| `is_active` | BOOLEAN | DEFAULT true | |
| `language` | VARCHAR(5) | DEFAULT 'ru' | Язык |

### 8.2 Таблица `notification_log`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL | Получатель |
| `event_type` | VARCHAR(100) | NOT NULL | Тип события |
| `channel` | VARCHAR(20) | NOT NULL | Канал |
| `subject` | TEXT | | Тема |
| `body` | TEXT | NOT NULL | Тело |
| `status` | VARCHAR(20) | NOT NULL | pending, sent, delivered, failed |
| `provider_response` | JSONB | | Ответ провайдера |
| `sent_at` | TIMESTAMPTZ | | Отправлено |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Partitioning:** по RANGE(`created_at`) — по месяцам

### 8.3 Таблица `device_tokens`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL | Пользователь |
| `token` | TEXT | NOT NULL | Push-токен |
| `platform` | VARCHAR(10) | NOT NULL | ios, android, web |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 9. Loyalty Service Database: `loyalty_db`

### 9.1 Таблица `loyalty_accounts`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | UNIQUE, NOT NULL | Пользователь |
| `level` | VARCHAR(20) | DEFAULT 'bronze' | bronze, silver, gold, platinum |
| `points_balance` | INTEGER | DEFAULT 0 | Текущий баланс баллов |
| `points_total_earned` | INTEGER | DEFAULT 0 | Всего заработано |
| `orders_count` | INTEGER | DEFAULT 0 | Кол-во заказов |
| `total_spent` | DECIMAL(12,2) | DEFAULT 0 | Потрачено всего |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### 9.2 Таблица `loyalty_transactions`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `account_id` | UUID | FK → loyalty_accounts.id, NOT NULL | Аккаунт |
| `type` | VARCHAR(20) | NOT NULL | earn, redeem, expire, bonus |
| `points` | INTEGER | NOT NULL | Кол-во баллов |
| `balance_after` | INTEGER | NOT NULL | Баланс после |
| `source` | VARCHAR(50) | NOT NULL | order, referral, promo, admin |
| `source_id` | UUID | | ID источника |
| `description` | TEXT | | Описание |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### 9.3 Таблица `referrals`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `referrer_user_id` | UUID | NOT NULL | Пригласивший |
| `referred_user_id` | UUID | UNIQUE, NOT NULL | Приглашённый |
| `reward_points` | INTEGER | NOT NULL | Баллы за referral |
| `status` | VARCHAR(20) | DEFAULT 'PENDING' | pending, completed |
| `completed_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 10. Review Service Database: `reviews_db`

### 10.1 Таблица `reviews`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL | Автор |
| `order_id` | UUID | UNIQUE, NOT NULL | Заказ |
| `rating` | SMALLINT | NOT NULL, CHECK 1-5 | Общий рейтинг |
| `comment` | TEXT | | Комментарий |
| `is_published` | BOOLEAN | DEFAULT true | Опубликован |
| `admin_response` | TEXT | | Ответ администратора |
| `admin_responded_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `deleted_at` | TIMESTAMPTZ | | |

**Индексы:**
- `idx_reviews_order_id` — UNIQUE на `order_id`
- `idx_reviews_user_id` — на `user_id`
- `idx_reviews_rating` — на `rating`
- `idx_reviews_created_at` — на `created_at DESC`

### 10.2 Таблица `review_service_ratings`

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | |
| `review_id` | UUID | FK → reviews.id, NOT NULL | Отзыв |
| `service_id` | UUID | NOT NULL | Услуга |
| `rating` | SMALLINT | NOT NULL, CHECK 1-5 | Рейтинг услуги |

---

## ER-диаграмма (ключевые связи)

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│  users   │────<│ addresses │     │   orders     │
│ (User DB)│     └───────────┘     │ (Order DB)   │
└────┬─────┘                       └──────┬───────┘
     │                                     │
     │  ┌───────────┐     ┌───────────────┐│
     │  │   roles   │     │  order_items  ││
     │  │ (Auth DB) │     └───────────────┘│
     │  └───────────┘                      │
     │         ┌───────────────────────┐   │
     ├────────>│  loyalty_accounts     │   │
     │         │  (Loyalty DB)         │   │
     │         └───────────────────────┘   │
     │                                     │
     │         ┌───────────────────────┐   │
     ├────────>│      payments         │<──┘
     │         │  (Payment DB)         │
     │         └───────────────────────┘
     │
     │         ┌───────────────────────┐
     ├────────>│      reviews          │
     │         │  (Review DB)          │
     │         └───────────────────────┘
     │
     │         ┌───────────────────────┐     ┌────────────┐
     └────────>│  notifications_log    │     │  services   │
               │  (Notif DB)           │     │ (Catalog DB)│
               └───────────────────────┘     └──────┬─────┘
                                                    │
              ┌──────────────────┐          ┌───────┴─────┐
              │  delivery_slots  │          │ fabric_types │
              │ (Delivery DB)    │          └─────────────┘
              └──────────────────┘
```

> Примечание: Связи между сервисами — логические (по UUID), не физические FK. Каждый сервис владеет своей БД.
