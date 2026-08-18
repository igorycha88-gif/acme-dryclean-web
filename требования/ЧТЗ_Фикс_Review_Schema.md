# ЧТЗ: Фикс Review snippet (Google Rich Results)

## Контекст
Google Rich Results Test выявил 3 невалидных элемента на главной странице
https://da-dryclean.ru/. Отзыв (Review snippet) не проходит валидацию.

## Ошибки Google
1. **Invalid object type for field `<parent_node>`** — отзывы обёрнуты в
   недопустимый тип `ItemList`.
2. **Multiple reviews without aggregateRating object** — отзывы в отдельном
   JSON-LD блоке, без связи с `aggregateRating`.

## Маршрут
Маршрут 1 (стандартная малая задача): Аналитик → Разработчик → Тестировщик → DevOps.

## Файлы для изменения
- `frontend/src/lib/structuredData.ts` — добавить `review` в `LocalBusiness`,
  удалить/заменить `generateReviewsJsonLd()` (ItemList).
- `frontend/src/app/page.tsx` — убрать отдельный `structured-data-reviews`
  блок, отзывы теперь внутри LocalBusiness блока.

## Решение
Вложить массив `review` (на основе `REVIEWS` из constants) в существующий
объект `LocalBusiness`, где уже есть `aggregateRating`. Удалить отдельный
JSON-LD блок `ItemList`.

### Структура после фикса
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "D&A Dry Cleaning — Химчистка на дому в Москве",
  ...
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "5000",
    "bestRating": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Ольга" },
      "datePublished": "2024-01-01",
      "reviewBody": "...",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      }
    }
  ]
}
```

## Критерии приёмки
- [ ] AC-1: В JSON-LD главной страницы нет отдельного блока `ItemList`
      с отзывами.
- [ ] AC-2: Отзывы (`review`) вложены в блок `LocalBusiness` рядом с
      `aggregateRating`.
- [ ] AC-3: Frontend Quality Gate проходит (`npm run lint && npx tsc --noEmit`).
- [ ] AC-4: Структура соответствует schema.org `LocalBusiness.review`.
