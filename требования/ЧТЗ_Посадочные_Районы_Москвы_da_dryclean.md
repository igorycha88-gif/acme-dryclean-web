# ЧТЗ: Посадочные страницы районов Москвы + удаление стоимости услуг со сайта

## 1. Описание задачи

**Часть A (Районы):** Создать посадочные страницы (landing pages) для всех районов Москвы (~124 района во всех округах). Формат URL: `/raiony/[slug]` (например `/raiony/marino` — «Химчистка на дому в Марьине»). Плюс индексная страница `/raiony` со всеми районами, сгруппированными по округам.

**Часть B (Удаление цен):** Убрать стоимость услуг со всего сайта. Стоимость озвучивает менеджер по телефону, либо клиент скачивает загруженный прайс (`/price-list.pdf` в футере — остаётся). Страница `/ceny` с таблицами цен удаляется полностью.

## 2. Маршрутизация

**Маршрут 1 (Стандартный):** Аналитик → Разработчик → Тестировщик → DevOps

**Обоснование:** Frontend-задача + минимальное изменение backend-схем (убрать поле `price` из Pydantic schema Content Service). Без миграций БД (колонка в БД остаётся, не разрушающе), без новых API-endpoints, без изменений архитектуры.

**Исполнитель:** Разработчик

## 3. Текущее состояние

- Посадочные страницы услуг `/uslugi/[slug]` реализованы (паттерн для подражания) ✅
- `sitemap.ts`, `robots.ts` существуют ✅
- Страница `/ceny` + `priceData.ts` с таблицами цен — под удаление ❌
- Цены захардкожены в: `serviceData.ts` (priceFrom/priceFromValue/priceUnit + SEO-тексты), `uslugi/page.tsx`, `uslugi/[slug]/page.tsx`, `vyezd/page.tsx`, `mebel/page.tsx`, `blogData.ts`, `structuredData.ts` (Offer) ❌
- Admin-панель услуг содержит поле «Цена (₽)»; backend schema Content Service отдаёт `price` ❌
- Ссылки на `/ceny`: `robots.ts` (3 места), `sitemap.ts`, `mebel/page.tsx`, `uslugi/[slug]/page.tsx` (relatedLinks) ❌
- Районов Москвы на сайте нет ❌

## 4. Критерии приёмки

### Часть A — Районы

#### AC-1: Индексная страница `/raiony`
- H1 «Химчистка по районам Москвы», вступительный текст без цен
- Все районы, сгруппированные по округам (ЦАО, САО, СВАО, ВАО, ЮВАО, ЮАО, ЮЗАО, ЗАО, СЗАО, ЗелАО) карточками-ссылками
- SEO metadata (title, description, canonical), JSON-LD (breadcrumb, LocalBusiness)
- Навигация (TopBar + Navigation) и Footer как на остальных страницах

#### AC-2: Посадочная страница района `/raiony/[slug]`
- Hero: «Химчистка на дому в {район в предложном падеже}» + подзаголовок + CTA (Заказать → #cta-district, телефон)
- Текст о районе: округ, ближайшее метро, выезд мастера за 1 час — БЕЗ ЦЕН
- Карточки услуг района (все 6 услуг, ссылки на `/uslugi/[slug]`)
- Блок «Как мы работаем» (3 шага)
- Блок преимуществ (5 пунктов)
- CTA-блок (телефон + заявка)
- Ссылка на соседние районы того же округа (до 6)
- SEO metadata: title/description с названием района, canonical, keywords
- JSON-LD: breadcrumb + LocalBusiness
- `generateStaticParams` для всех районов (статика)
- 404 для несуществующего slug (notFound())

#### AC-3: Интеграция
- `sitemap.ts` содержит `/raiony` и все страницы районов
- `robots.ts` разрешает индексацию `/raiony`
- Footer: ссылка «Районы» → `/raiony` (рядом с «Прайс-лист»)

#### AC-4: Мобильная адаптация
- Обе страницы адаптивны (mobile-first)

### Часть B — Удаление цен

#### AC-5: Страницы услуг без цен
- `uslugi/[slug]/page.tsx`: hero без блока цены; убрать priceFrom из рендера
- `uslugi/page.tsx`: карточки без цен; SEO-тексты без «от N ₽»
- `serviceData.ts`: удалить поля priceFrom/priceFromValue/priceUnit; вычистить суммы из fullDescription, seoTitle, seoDescription; формулировки «Цена от …» заменить на «Стоимость рассчитает мастер после осмотра» / убрать
- `vyezd/page.tsx`: убрать массивы цен у направлений, бейдж «Цена от 1000 ₽», суммы из SEO-текстов и FAQ
- `mebel/page.tsx`: убрать ценовые карточки/бейджи, суммы из SEO-текстов и FAQ

#### AC-6: Удаление страницы цен
- Файлы `frontend/src/app/ceny/page.tsx` и `frontend/src/lib/priceData.ts` удалены
- Ссылки на `/ceny` убраны из: `robots.ts`, `sitemap.ts`, `mebel/page.tsx`, `uslugi/[slug]/page.tsx` (relatedLinks → заменить на `/raiony`)
- Футер: «Прайс-лист» (PDF) остаётся без изменений; `/api/price-list` работает

#### AC-7: Блог без цен
- `blogData.ts`: из текстов статей убраны все суммы («от 1700 ₽», «от 1000 ₽», «350 ₽/м²», «200–500 ₽», «от 800 ₽» и т.п.); строку сравнения цен в таблице заменить качественным сравнением или удалить

#### AC-8: Structured Data без цен
- `structuredData.ts`: из `generateServiceJsonLd` убрать блок offers (price, priceCurrency, UnitPriceSpecification); LocalBusiness.priceRange «$$$»-типа не содержит сумм — заменить на нечисловой диапазон или удалить

#### AC-9: Admin и API без цен
- Admin `/admin/services` (список): колонка «Цена» убрана
- Admin new/[id]: поле «Цена (₽)» убрано из форм и state
- `frontend/src/lib/api.ts`: поле `price` убрано из типа
- Backend `backend/services/content/app/schemas/schemas.py`: поле `price` убрано из ServiceCreate/ServiceUpdate/ServiceRead; колонка в БД остаётся (миграция не требуется)

#### AC-10: Глобальная проверка
- `rg "₽|руб\.|от \d{4,}" frontend/src` (кроме api/price-list route и PDF-ссылок) — пусто
- Тексты формулировок: вместо цен — «стоимость рассчитает мастер», «прайс-лист в PDF», «менеджер озвучит по телефону»

## 5. Декомпозиция задач

### TASK-FRT-1: Данные районов
- `frontend/src/lib/districtData.ts`: ~124 района (name, namePrepositional, slug, okrug, metro[]), функции getDistrictBySlug, getAllDistrictSlugs, getDistrictsByOkrug, getOtherDistricts (соседи по округу), OKRUGS

### TASK-FRT-2: Индексная страница `/raiony`
- `frontend/src/app/raiony/page.tsx` по AC-1

### TASK-FRT-3: Посадочная района `/raiony/[slug]`
- `frontend/src/app/raiony/[slug]/page.tsx` по AC-2

### TASK-FRT-4: Удаление цен (frontend)
- По AC-5–AC-8: serviceData, uslugi (обе страницы), vyezd, mebel, ceny/page.tsx + priceData.ts (удалить), blogData, structuredData, robots.ts, sitemap.ts, Footer (ссылка Районы)

### TASK-FRT-5: Admin без цен
- По AC-9 (frontend-часть)

### TASK-BCK-1: Backend без цен в API
- `backend/services/content/app/schemas/schemas.py`: убрать price из схем

### TASK-QA-1: Quality Gate
- Frontend: `npm run lint && npx tsc --noEmit && npm run build`
- Backend: `pytest tests/ -v --cov=app && ruff check . && mypy app/` (в content service)

## 6. Файлы

### Новые:
| Файл | Описание |
|------|----------|
| `frontend/src/lib/districtData.ts` | Данные всех районов Москвы по округам |
| `frontend/src/app/raiony/page.tsx` | Индексная страница районов |
| `frontend/src/app/raiony/[slug]/page.tsx` | Посадочная страница района |

### Изменяемые:
| Файл | Изменение |
|------|-----------|
| `frontend/src/lib/serviceData.ts` | Удалить ценовые поля и суммы из текстов/SEO |
| `frontend/src/lib/blogData.ts` | Убрать суммы из статей |
| `frontend/src/lib/structuredData.ts` | Убрать offers/цены из схем |
| `frontend/src/lib/api.ts` | Убрать price из типа |
| `frontend/src/app/uslugi/page.tsx` | Убрать цены |
| `frontend/src/app/uslugi/[slug]/page.tsx` | Убрать цену из hero, заменить /ceny ссылку |
| `frontend/src/app/vyezd/page.tsx` | Убрать цены |
| `frontend/src/app/mebel/page.tsx` | Убрать цены и ссылку /ceny |
| `frontend/src/app/sitemap.ts` | Убрать /ceny, добавить /raiony + районы |
| `frontend/src/app/robots.ts` | Убрать /ceny, добавить /raiony |
| `frontend/src/components/Footer.tsx` | Добавить ссылку «Районы» |
| `frontend/src/app/admin/services/page.tsx` | Убрать колонку цены |
| `frontend/src/app/admin/services/new/page.tsx` | Убрать поле цены |
| `frontend/src/app/admin/services/[id]/page.tsx` | Убрать поле цены |
| `backend/services/content/app/schemas/schemas.py` | Убрать price из схем |

### Удаляемые:
| Файл | Причина |
|------|---------|
| `frontend/src/app/ceny/page.tsx` | Страница цен больше не нужна (PDF остаётся) |
| `frontend/src/lib/priceData.ts` | Данные таблиц цен не нужны |

## 7. Технические решения

- **Статические данные районов** — как у услуг: мгновенная отдача + SEO
- **generateStaticParams** — предгенерация ~124 страниц при сборке
- **Программный SEO-шаблон** — контент района строится из полей (округ, метро), уникальность обеспечивается данными района
- **Без миграций БД** — колонка price в БД не трогается (не разрушающе), только скрывается из API
- **Формулировки вместо цен** — «Точную стоимость озвучит менеджер после осмотра», «Скачайте прайс-лист», «Оплата по факту, без предоплаты»
