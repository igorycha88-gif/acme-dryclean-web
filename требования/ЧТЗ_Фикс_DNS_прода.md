# ЧТЗ: Восстановление доступности прода (DNS apex + nginx)

## Постановка
Сайт `da-dryclean.ru` недоступен на проде.

## Корневая причина (подтверждено)
1. На NS-серверах reg.ru (ns1/ns2.reg.ru) **отсутствует A-запись для apex-домена** `da-dryclean.ru`.
   Проверено через 8.8.8.8, 1.1.1.1 и авторитетный ns1.reg.ru — пустой ответ.
   `www.da-dryclean.ru` → 37.143.15.148 (A есть).
2. Nginx редиректит весь трафик (www и apex) на `https://da-dryclean.ru` (apex).
   Т.к. apex не резолвится — сайт недоступен по любому адресу.

Сервер и сервисы полностью исправны (frontend:3000, content:8011, tracking:8020, postgres — healthy; SSL валиден до 19.08; nginx локально через SNI → 200).

## Маршрут
Инфраструктурная задача → Аналитик → DevOps (Маршрут 3).

## План исправления

### TASK-INF-1 (DevOps, немедленно): перенастройка nginx
Файл: `/etc/nginx/nginx.conf` (на VPS)
- В server :80 заменить `return 301 https://da-dryclean.ru...` → `return 301 https://$host$request_uri;` (сохранять host).
- Удалить отдельный server :443 для `www` (редирект www→apex) — он ломает доступ, пока apex не резолвится.
- В основном server :443 указать `server_name da-dryclean.ru www.da-dryclean.ru;` (обслуживает оба).
- Бэкап конфига перед изменением.
- `nginx -t` → `nginx -s reload`.

Ожидаемый эффект немедленно: `https://www.da-dryclean.ru` → HTTP 200 (сайт работает).

### TASK-INF-2 (пользователь, reg.ru): добавить A-запись apex
В панели DNS reg.ru добавить:
- Тип: A, Хост: `@` (или пустое имя), Значение: `37.143.15.148`, TTL: по умолчанию.
После применения (до 24ч) `https://da-dryclean.ru` начнёт работать.

## Критерии приёмки
- `curl https://www.da-dryclean.ru` → 200 (после TASK-INF-1).
- `nginx -t` успешен, reload без ошибок.
- Логи nginx без ошибок.
- После TASK-INF-2: `dig A da-dryclean.ru @ns1.reg.ru` → 37.143.15.148, `curl https://da-dryclean.ru` → 200.

## Риски / откат
- Откат: восстановить `/etc/nginx/nginx.conf.bak_dns_fix` + reload.
- Дублирование контента www/apex на время (SEO-побочный эффект) — приемлемо для восстановления доступности; после фикса DNS можно вернуть canonical-редирект www→apex.
