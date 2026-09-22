# ЧТЗ: Смена получателей + таймауты SMTP

**Дата:** 2026-09-22
**Статус:** УТВЕРЖДЕНО (малая задача + баг-фикс)
**Маршрутизация:** Аналитик → Разработчик → Тестировщик → DevOps

## 1. Задача
1. Получатели заявок: **убрать** `Alenka200893@yandex.ru`, **добавить** `da-drycleaning@mail.ru`.
   Итоговый `SMTP_TO=igorycha.s@yandex.ru,da-drycleaning@mail.ru`.
2. Баг: POST `/api/orders` завис >120 сек при недоступном/медленном SMTP
   (nodemailer без таймаутов). Пользователь получает молчание вместо ошибки.

## 2. Изменения
| Файл | Действие |
|---|---|
| `.env`, `.env.example`, `docker-compose.dev.yml` | новый список получателей |
| `frontend/src/app/api/orders/route.ts` | таймауты транспорта: connectionTimeout=10s, greetingTimeout=10s, socketTimeout=20s |
| `frontend/src/app/api/orders/route.test.ts` | + тест: таймауты переданы в createTransport |

## 3. Критерии приёмки
- **AC-1:** конфиги содержат `igorycha.s@yandex.ru,da-drycleaning@mail.ru`; `Alenka200893@yandex.ru` отсутствует.
- **AC-2:** транспорт создаётся с таймаутами; при SMTP-сборе/зависании ответ ≤ ~30 сек (502).
- **AC-3:** `npm test` / lint / tsc — зелёные; e2e-отправка на проде-деве проверена.
