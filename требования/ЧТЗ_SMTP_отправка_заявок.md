# ЧТЗ: Отправка заявок по SMTP (Яндекс)

**Дата:** 2026-09-22
**Статус:** УТВЕРЖДЕНО (упрощённая форма — малая задача)
**Маршрутизация:** Аналитик → Разработчик → Тестировщик → DevOps (Маршрут 1)

---

## 1. Контекст

Формы заявок на сайте (`frontend/src/components/Hero.tsx`, `frontend/src/components/CTAForm.tsx`)
отправляют `{name, phone, service_type}`:

1. Сначала на `API_BASE_URL/api/v1/orders` (API Gateway :8000 — сервис **не существует** в инфраструктуре);
2. Fallback — Next.js API route `/api/orders`, который тоже проксирует на несуществующий шлюз.

**Итог: все заявки с сайта сейчас теряются.**

Решение: реализовать реальную отправку заявок письмом на email через SMTP
(Яндекс, `smtp.yandex.ru:465`) в Next.js API route `/api/orders`.

## 2. Решения (подтверждены пользователем)

| Параметр | Значение |
|---|---|
| Провайдер | Яндекс |
| SMTP | `smtp.yandex.ru:465` (SSL) |
| Получатель | `da-drycleaning@yandex.ru` |
| Точка отправки | Next.js API route `/api/orders` (nodemailer) |

## 3. Требования

### FR-1. Отправка письма при получении заявки
- POST `/api/orders` с телом `{name, phone, service_type}`:
  - Валидация: `name` (1–100 симв.), `phone` (7–20 симв., `+0-9() -`), `service_type` (не пустой).
  - Письмо на `SMTP_TO`: тема «Новая заявка: {service_type}», текст — таблица полей
    (Имя, Телефон, Услуга, Дата, страница-источник `Referer` если есть).
  - HTML + plain-text версии письма.
- Ответ при успехе: `200 {"ok": true, "channel": "email"}`.

### FR-2. Поведение при недоступном SMTP
- Если SMTP не настроен (нет `SMTP_USER`/`SMTP_PASS`) → сохраняется старое поведение
  (проксирование на `API_BASE_URL/api/v1/orders`) для обратной совместимости.
- Если SMTP настроен, но отправка не удалась → `502 {"ok": false, "error": "email_failed"}`;
  в лог — детали ошибки. Заявка НЕ теряется молча: форма показывает «Ошибка отправки».

### FR-3. Конфигурация (env)
- `SMTP_HOST` (default `smtp.yandex.ru`)
- `SMTP_PORT` (default `465`)
- `SMTP_SECURE` (default `true` — для 465)
- `SMTP_USER` — ящик-отправитель (например `da-drycleaning@yandex.ru`)
- `SMTP_PASS` — «пароль приложения» Яндекса (НЕ основной пароль)
- `SMTP_TO` — получатель (default = `SMTP_USER`)
- Секреты не логируются, не коммитятся. `.env.example` дополняется секцией с пустым `SMTP_PASS`.

### FR-4. Инфраструктура
- `docker-compose.dev.yml`: frontend-сервис получает `SMTP_*` переменные из окружения.
- `frontend/package.json`: добавить `nodemailer` + `@types/nodemailer` (dev).

### FR-5. Инструкция для владельца (token/app password Яндекс)
Выдаётся в итоговом отчёте (см. раздел 7).

## 4. Не входит в объём
- Сохранение заявок в БД; Telegram-нотификации; антиспам/honeypot; изменение UI форм.

## 5. Файлы для изменения
| Файл | Действие |
|---|---|
| `frontend/src/app/api/orders/route.ts` | Переписать: валидация + nodemailer |
| `frontend/package.json` | + nodemailer, @types/nodemailer |
| `.env.example` | + секция SMTP |
| `docker-compose.dev.yml` | + SMTP_* env для frontend |

## 6. Критерии приёмки
- **AC-1:** POST `/api/orders` с валидными данными при настроенном SMTP → письмо уходит на `SMTP_TO`, ответ 200 `{"ok": true, "channel": "email"}`.
- **AC-2:** Невалидный `phone`/пустое `name` → 400, письмо не отправляется.
- **AC-3:** Без `SMTP_USER`/`SMTP_PASS` → старое поведение (проксирование).
- **AC-4:** SMTP-ошибка → 502 `{"ok": false, "error": "email_failed"}`, секреты не в логах.
- **AC-5:** `npm run lint` и `npx tsc --noEmit` проходят.
- **AC-6:** `.env.example` и `docker-compose.dev.yml` содержат все `SMTP_*` переменные.

## 7. Инструкция: как получить «токен» (пароль приложения) Яндекса

> Для SMTP Яндекс использует **пароль приложения** — отдельный пароль вместо основного.

1. Войдите в Яндекс ID: https://id.yandex.ru — аккаунт `da-drycleaning@yandex.ru`.
2. Включите **двухфакторную аутентификацию** (без неё пароли приложений недоступны):
   https://id.yandex.ru/security → «Двухфакторная аутентификация» → установить приложение-ключ
   (Яндекс Ключ на телефон) и привязать номер.
3. Создайте пароль приложения: https://id.yandex.ru/security → «Пароли приложений» →
   «Создать новый пароль» → категория **«Почта»** → имя, например `dryclean-site`.
4. Яндекс покажет сгенерированный пароль (один раз!) — скопируйте его. Это и есть ваш «токен»
   → значение для `SMTP_PASS`.
5. Заполните `.env`:
   ```
   SMTP_HOST=smtp.yandex.ru
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=da-drycleaning@yandex.ru
   SMTP_PASS=<пароль приложения из шага 4>
   SMTP_TO=da-drycleaning@yandex.ru
   ```
6. Важно: основной пароль ящика нигде не используется; пароль приложения можно
   отозвать в любой момент в том же разделе «Пароли приложений».
