# ЧТЗ: Фикс ошибок прода — невалидный regex в pattern + 404 /api/api/v1/orders

**Дата:** 2026-09-22
**Статус:** УТВЕРЖДЕНО (упрощённая форма — малая задача)
**Маршрутизация:** Аналитик → Разработчик → Тестировщик → DevOps (Маршрут 1, постдеплойный рестарт по Правилу 11)

---

## 1. Контекст (ошибки с продакшена da-dryclean.ru)

1. `Pattern attribute value [+]?[0-9\s\-()]{7,} is not a valid regular expression:
   Invalid character in character class (v-flag)`
   — Chrome 125+ компилирует HTML-атрибут `pattern` с флагом `v` (Unicode Sets),
   где `(` `)` внутри символьного класса ОБЯЗАНЫ быть экранированными.
2. `/api/api/v1/orders 404 (Not Found)`
   — `frontend/Dockerfile` (ARG `NEXT_PUBLIC_API_URL=/api`) + `frontend/src/lib/api.ts`
   (`createOrder` → `API_BASE_URL + "/api/v1/orders"`) дают задвоенный префикс `/api/api/...`.
   Nginx (`location /api/` → content-сервис) возвращает 404.
   Заявки реально доставляются через второй (fallback) вызов `/api/orders` → SMTP,
   но с мусорным 404-запросом и ошибкой в консоли.

## 2. Решения

| # | Решение |
|---|---|
| 1 | `pattern` в Hero.tsx и CTAForm.tsx → v-совместимый: `[+]?[0-9\s\-\(\)]{7,}` (валиден в u/v/обычном режимах) |
| 2 | `createOrder` в api.ts → POST напрямую на Next.js route `/api/orders` (единственная точка входа по ЧТЗ_SMTP); тип ответа `{ok, channel}` |
| 3 | Hero.tsx / CTAForm.tsx: убрать дублирующий fallback-fetch (createOrder теперь сам бьёт в верный endpoint) |
| 4 | `PHONE_RE` в helpers.ts → согласовать экранирование `\(\)` (функционально идентично, для консистентности) |

## 3. Файлы для изменения

| Файл | Действие |
|---|---|
| `frontend/src/lib/api.ts` | `createOrder` → POST `/api/orders` |
| `frontend/src/components/Hero.tsx` | pattern-фикс + убрать fallback fetch |
| `frontend/src/components/CTAForm.tsx` | pattern-фикс + убрать fallback fetch |
| `frontend/src/app/api/orders/helpers.ts` | PHONE_RE — согласовать экранирование |

## 4. Не входит в объём
- Мёртвые `getServices`/`getReviews` (указывают на несуществующий шлюз, вызовов нет) — оставить как есть.
- Изменения nginx, Dockerfile, env.

## 5. Критерии приёмки
- **AC-1:** `pattern="[+]?[0-9\s\-\(\)]{7,}"` в Hero.tsx и CTAForm.tsx; `new RegExp(pattern, "v")` не выбрасывает исключение (проверка тестом).
- **AC-2:** `createOrder` отправляет POST на `/api/orders` (один запрос, без `/api/api/...`), возвращает `{ok, channel} | null`.
- **AC-3:** Hero/CTAForm: один вызов createOrder, при `null` — статус error, при объекте — sent. Двойной отправки нет.
- **AC-4:** `npm run lint` и `npx tsc --noEmit` проходят.
- **AC-5:** Существующие тесты (`vitest run`) проходят; добавлены тесты на v-валидность pattern и createOrder.
