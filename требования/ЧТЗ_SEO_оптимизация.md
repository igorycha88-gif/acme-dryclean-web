# ЧТЗ: SEO-оптимизация сайта D&A Dry Cleaning

## 1. Бизнес-контекст

**Заказчик:** D&A Dry Cleaning  
**Цель:** Вывести сайт da-dryclean.ru на первые страницы Яндекс и Google по ключевым запросам химчистки в Москве и МО.  
**Целевой регион:** Москва и Московская область  
**Текущее состояние:** SEO-база заложена (метаданные, JSON-LD, sitemap, robots.txt, Метрика), но есть критичные пропуски и потенциал для усиления.

---

## 2. Проблемы (текущий аудит)

| # | Проблема | Критичность | Влияние на SEO |
|---|----------|-------------|----------------|
| P1 | Заглушки верификации Яндекс/Google | 🔴 Высокая | Без верификации — нет индексации и мониторинга |
| P2 | Отсутствует og-image.png (1200x630) | 🔴 Высокая | Нет превью при шаринге, теряется трафик из соцсетей |
| P3 | Отсутствует favicon.ico + apple-touch-icon | 🔴 Высокая | 404 на каждый запрос favicon — минус в PageSpeed |
| P4 | Нет manifest.webmanifest (PWA) | 🟡 Средняя | Потеря мобильного трафика, нет иконок на домашнем экране |
| P5 | Нет раздела блога/статей | 🔴 Высокая | Яндекс любит контент; нет длинного хвоста запросов |
| P6 | Статьи в serviceData.ts — мёртвые (нет страниц) | 🟡 Средняя | Ссылки из посадочных ведут в никуда |
| P7 | H1 на /uslugi — «Наши услуги» без ключевых слов | 🟡 Средняя | Слабая релевантность поисковым запросам |
| P8 | Нет alt-текста для изображений-заглушек статей | 🟡 Средняя | Потеря трафика из Google Images |
| P9 | Google Fonts блокируют рендеринг | 🟡 Средняя | Ухудшение PageSpeed Score (FCP, LCP) |
| P10 | Нет кэширования статики через Cache-Control | 🟡 Средняя | Плохой PageSpeed |
| P11 | Нет внутренней перелинковки между статьями | 🟡 Средняя | Слабый link juice |
| P12 | Нет тега `<h1>` с ключевым запросом на главной (в компоненте Hero) | 🟡 Средняя | Слабая релевантность |

---

## 3. Решение

### 3.1. Техническая оптимизация (TASK-SEO-TECH)

#### 3.1.1. Верификация в Яндекс.Вебмастер и Google Search Console
- **Инструкция** для пользователя (вывести в отчёте):
  1. Перейти на https://webmaster.yandex.ru → добавить сайт da-dryclean.ru → выбрать метод «HTML-тег» → скопировать content-значение из meta-тега
  2. Перейти на https://search.google.com/search-console → добавить ресурс → метод «HTML-тег» → скопировать content-значение
- В коде: заменить заглушки `YOUR_YANDEX_VERIFICATION_CODE` / `YOUR_GOOGLE_VERIFICATION_CODE` на переменные окружения `NEXT_PUBLIC_YANDEX_VERIFICATION` / `NEXT_PUBLIC_GOOGLE_VERIFICATION`

#### 3.1.2. OG-изображение (og-image.png)
- Создать placeholder OG-изображение (SVG-based или gradient) 1200x630 с текстом «D&A Dry Cleaning — Химчистка на дому в Москве»
- Сохранить в `/public/og-image.png`
- Позже заменить на реальное фото

#### 3.1.3. Favicon и иконки
- Создать набор favicon: favicon.ico (32x32), apple-touch-icon.png (180x180), android-chrome-192x192.png, android-chrome-512x512.png
- Сохранить в `/public/`
- Добавить manifest.webmanifest с иконками
- Обновить layout.tsx: подключить favicon, apple-touch-icon, manifest

#### 3.1.4. Оптимизация загрузки шрифтов
- Заменить Google Fonts `<link>` на `next/font/google` для автоматической оптимизации (self-hosted, no FOUT)
- Использовать `display: 'swap'` для шрифтов
- Удалить `<link>` теги из `<head>`

#### 3.1.5. Cache-Control заголовки для статики
- Добавить в `next.config.ts` заголовки для статики:
  ```
  /images/* → Cache-Control: public, max-age=31536000, immutable
  /_next/static/* → Cache-Control: public, max-age=31536000, immutable
  /favicon.ico → Cache-Control: public, max-age=86400
  ```

#### 3.1.6. robots.ts — расширить доступ
- Добавить `/blog` и `/blog/` в `allow` для всех ботов
- Разрешить индексацию `/images/` (сейчас запрещено — теряем Google Images трафик)

---

### 3.2. Контентная оптимизация (TASK-SEO-CONTENT)

#### 3.2.1. Улучшение мета-тегов и заголовков
- Главная: H1 в Hero компоненте — добавить ключевые слова «химчистка мебели на дому в Москве»
- /uslugi: H1 заменить с «Наши услуги» на «Услуги химчистки на дому в Москве — цены»
- Усилить description на всех страницах (добавить УТП, цены, city name)

#### 3.2.2. Семантическая разметка контента
- Добавить schema.org `Article` для статей блога
- Усилить `Service` schema: добавить `offers.price` (цена от)
- Добавить `ImageObject` schema для Hero-изображений

---

### 3.3. Раздел блога (TASK-SEO-BLOG)

#### 3.3.1. Структура страниц блога
```
/blog                          → Список статей (SSG)
/blog/[slug]                   → Статья (SSG)
```

#### 3.3.2. Компоненты блога
- `BlogListPage` — сетка карточек статей с пагинацией
- `BlogArticlePage` — полная статья с автором, датой, хлебными крошками, связанными статьями, CTA-блоком

#### 3.3.3. Модель данных статьи (фронтенд, статичные данные)
```typescript
interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string;        // markdown или HTML-строка
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;     // ISO date
  updatedAt: string;
  author: string;
  category: string;        // e.g. "химчистка диванов", "уход за мебелью"
  tags: string[];
  relatedServices: string[];  // slugs связанных услуг
  image: string;           // OG image для статьи
}
```

#### 3.3.4. SEO для блога
- `generateMetadata()` для каждой статьи: title, description, canonical, OG, Twitter
- JSON-LD: `Article` schema (headline, datePublished, dateModified, author, image, publisher)
- JSON-LD: `BreadcrumbList` (Главная → Блог → Статья)
- Автоматическое добавление статей в sitemap.xml
- Хлебные крошки (видимые + JSON-LD)

#### 3.3.5. Начальные статьи (6 SEO-статей)
Статьи из `serviceData.ts` (статьи уже описаны в данных услуг) + 2 дополнительные:

1. **kak-chasto-chistit-divan** — «Как часто нужно чистить диван?» (из данных himchistka-divanov)
2. **5-sposobov-udalit-pyatno-s-divana** — «5 способов удалить пятно с дивана» (из данных)
3. **himchistka-ili-stirka-chehlov** — «Химчистка или стирка чехлов: что выбрать?» (из данных)
4. **zachem-chistit-matras** — «Зачем чистить матрас: 5 причин» (из данных himchistka-matrasov)
5. **ekstraktornaya-chistka-kovrov** — «Экстракторная чистка: что это и почему эффективна» (из данных himchistka-kovrov)
6. **uhod-za-shtorami** — «Уход за шторами: 7 простых правил» (из данных himchistka-shtor)

Каждая статья: 1500-3000 символов текста, SEO-оптимизированный заголовок, внутренние ссылки на услуги.

#### 3.3.6. Перелинковка
- Из статей блога → ссылки на связанные услуги (/uslugi/[slug])
- Из посадочных страниц услуг → ссылки на связанные статьи (/blog/[slug])
- Из статей → ссылки на другие статьи (по тегам/категориям)
- Footer: добавить ссылку «Блог» в навигацию

---

### 3.4. Связывание статей с посадочными страницами (TASK-SEO-LINKS)

- Обновить блок «Полезные статьи» на /uslugi/[slug]: вместо мёртвых заглушек — реальные ссылки на /blog/[slug]
- Добавить блок «Похожие статьи» с перелинковкой
- В статьях блога — блок «Связанные услуги» с CTA

---

## 4. Критерии приёмки

| # | Критерий | Проверка |
|---|----------|----------|
| AC1 | Все meta-теги присутствуют и уникальны на каждой странице | View source каждой страницы |
| AC2 | og-image.png доступен по URL /og-image.png | curl /og-image.png → 200 |
| AC3 | favicon.ico доступен | curl /favicon.ico → 200 |
| AC4 | manifest.webmanifest валидный | curl /manifest.webmanifest → 200, валидный JSON |
| AC5 | Шрифты загружаются через next/font (нет внешних link на fonts.googleapis.com) | View source — нет external font links |
| AC6 | Cache-Control заголовки на статике | curl -I /images/services/sofa.jpg → содержит Cache-Control |
| AC7 | /blog — страница списка статей | curl /blog → 200 |
| AC8 | /blog/[slug] — минимум 6 статей | curl /blog/kak-chasto-chistit-divan → 200 |
| AC9 | Sitemap содержит все страницы блога | curl /sitemap.xml → содержит /blog/* |
| AC10 | robots.txt разрешает /blog и /images/ | curl /robots.txt → allow /blog, allow /images |
| AC11 | JSON-LD Article на каждой статье | View source → schema.org/Article |
| AC12 | Хлебные крошки на всех страницах блога | Визуальная проверка |
| AC13 | Внутренняя перелинковка: услуги ↔ статьи | Клик по ссылкам — все работают |
| AC14 | Переменные верификации вынесены в env | В коде — process.env.NEXT_PUBLIC_* |
| AC15 | Google PageSpeed Insights ≥ 90 (mobile) | Тест на pagespeed.web.dev |
| AC16 | npm run lint && npx tsc --noEmit — без ошибок | CLI |

---

## 5. Декомпозиция задач

### TASK-SEO-TECH — Техническая SEO-оптимизация
- Верификация: env-переменные + инструкция
- OG-image placeholder
- Favicon + apple-touch-icon + manifest.webmanifest
- next/font/google вместо Google Fonts CDN
- Cache-Control заголовки
- robots.ts обновление

### TASK-SEO-CONTENT — Контентная оптимизация
- H1 на главной (Hero) — ключевые слова
- H1 на /uslugi — ключевые слова
- Улучшение descriptions
- Schema.org enhancements

### TASK-SEO-BLOG — Раздел блога
- blogData.ts — данные 6 статей
- /blog/page.tsx — список статей
- /blog/[slug]/page.tsx — страница статьи
- SEO: metadata, JSON-LD Article, BreadcrumbList
- Обновление sitemap.ts и robots.ts

### TASK-SEO-LINKS — Перелинковка и навигация
- Обновить блок «Полезные статьи» на /uslugi/[slug] — живые ссылки
- Footer: ссылка на блог
- Связанные статьи в BlogArticlePage
- Связанные услуги в статьях

---

## 6. Файлы для изменения

### Новые файлы:
- `frontend/public/og-image.png` — OG-изображение (placeholder SVG → PNG)
- `frontend/public/favicon.ico`
- `frontend/public/apple-touch-icon.png`
- `frontend/public/android-chrome-192x192.png`
- `frontend/public/android-chrome-512x512.png`
- `frontend/public/manifest.webmanifest`
- `frontend/src/lib/blogData.ts` — данные статей блога
- `frontend/src/app/blog/page.tsx` — список статей
- `frontend/src/app/blog/[slug]/page.tsx` — страница статьи

### Изменяемые файлы:
- `frontend/src/app/layout.tsx` — next/font, favicon, manifest, env-верификация
- `frontend/next.config.ts` — Cache-Control, headers
- `frontend/src/app/robots.ts` — allow /blog, /images
- `frontend/src/app/sitemap.ts` — добавить /blog, /blog/*
- `frontend/src/app/page.tsx` — метаданные
- `frontend/src/app/uslugi/page.tsx` — H1, метаданные
- `frontend/src/app/uslugi/[slug]/page.tsx` — живые ссылки на статьи
- `frontend/src/components/Hero.tsx` — H1 с ключевыми словами
- `frontend/src/components/Footer.tsx` — ссылка на блог
- `frontend/src/lib/structuredData.ts` — Article schema
- `.env` (или `.env.local`) — переменные верификации

---

## 7. Маршрутизация

**Маршрут:** Стандартный (Маршрут 1)  
**Исполнитель:** 💻 Разработчик  
**Этапы:** Аналитик → Разработчик → Тестировщик → DevOps

---

## 8. Как получить коды верификации

### Яндекс.Вебмастер:
1. Перейдите на https://webmaster.yandex.ru
2. Нажмите «Добавить сайт» → введите `da-dryclean.ru`
3. Выберите метод подтверждения → «HTML-тег»
4. Скопируйте значение из `content="XXXXXX"` — это ваш код
5. Запишите в `.env.local`: `NEXT_PUBLIC_YANDEX_VERIFICATION=XXXXXX`

### Google Search Console:
1. Перейдите на https://search.google.com/search-console
2. Нажмите «Добавить ресурс» → введите `https://da-dryclean.ru`
3. Выберите метод → «HTML-тег»
4. Скопируйте значение из `content="XXXXXX"` — это ваш код
5. Запишите в `.env.local`: `NEXT_PUBLIC_GOOGLE_VERIFICATION=XXXXXX`
