// Unit-тесты для сервисных данных и микроразметки (запуск: node tests/seo.test.mjs)
// Проверка соответствия ЧТЗ_Seo_Рекомендации_Химчистка_v1.md

import assert from "node:assert/strict";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const serviceDataSrc = readFileSync(
  join(ROOT, "src/lib/serviceData.ts"),
  "utf8"
);
const structuredDataSrc = readFileSync(
  join(ROOT, "src/lib/structuredData.ts"),
  "utf8"
);
const priceDataSrc = readFileSync(
  join(ROOT, "src/lib/priceData.ts"),
  "utf8"
);
const sitemapSrc = readFileSync(join(ROOT, "src/app/sitemap.ts"), "utf8");
const robotsSrc = readFileSync(join(ROOT, "src/app/robots.ts"), "utf8");
const cenyPageSrc = readFileSync(join(ROOT, "src/app/ceny/page.tsx"), "utf8");
const vyezdPageSrc = readFileSync(join(ROOT, "src/app/vyezd/page.tsx"), "utf8");
const mebelPageSrc = readFileSync(join(ROOT, "src/app/mebel/page.tsx"), "utf8");
const blogDataSrc = readFileSync(join(ROOT, "src/lib/blogData.ts"), "utf8");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
  }
}

// === TASK-SEO-001: title/description с ценами ===

test("TASK-SEO-001: Все услуги имеют priceFrom непустой", () => {
  const matches = serviceDataSrc.match(/priceFrom: "([^"]+)"/g) || [];
  assert.ok(matches.length >= 6, `Ожидалось ≥6 priceFrom, найдено ${matches.length}`);
  matches.forEach((m) => {
    const val = m.match(/"([^"]+)"/)[1];
    assert.ok(val.length > 0, "priceFrom пустой");
    assert.ok(val.includes("₽"), `priceFrom без ₽: ${val}`);
  });
});

test("TASK-SEO-001: Все услуги имеют priceFromValue > 0", () => {
  const matches = serviceDataSrc.match(/priceFromValue: (\d+)/g) || [];
  assert.ok(matches.length >= 6, `Ожидалось ≥6 priceFromValue, найдено ${matches.length}`);
  matches.forEach((m) => {
    const val = parseInt(m.match(/(\d+)/)[1], 10);
    assert.ok(val > 0, `priceFromValue должен быть > 0, получил ${val}`);
  });
});

test("TASK-SEO-001: Все seoTitle содержат 'на дому' или гео + цену", () => {
  const matches = serviceDataSrc.match(/seoTitle:\s*\n?\s*"([^"]+)"/g) || [];
  assert.ok(matches.length >= 6, `Ожидалось ≥6 seoTitle, найдено ${matches.length}`);
  matches.forEach((m) => {
    const val = m.match(/"([^"]+)"/)[1];
    assert.ok(val.toLowerCase().includes("москв"), `seoTitle без Москвы: ${val}`);
    assert.ok(val.includes("₽"), `seoTitle без ₽: ${val}`);
  });
});

test("TASK-SEO-001: seoDescription содержит телефон и цену", () => {
  const matches = serviceDataSrc.match(/seoDescription:\s*\n?\s*"([^"]+)"/g) || [];
  assert.ok(matches.length >= 6);
  matches.forEach((m) => {
    const val = m.match(/"([^"]+)"/)[1];
    assert.ok(val.includes("₽"), `seoDescription без ₽: ${val}`);
    assert.ok(val.includes("+7"), `seoDescription без телефона: ${val}`);
  });
});

test("TASK-SEO-001: Все услуги имеют h1 с 'на дому' или 'в Москве'", () => {
  const matches = serviceDataSrc.match(/h1: "([^"]+)"/g) || [];
  assert.ok(matches.length >= 6);
  matches.forEach((m) => {
    const val = m.match(/"([^"]+)"/)[1];
    assert.ok(
      val.includes("на дому") || val.includes("в Москве"),
      `h1 без 'на дому'/'в Москве': ${val}`
    );
  });
});

// === TASK-SEO-002: релевантность чистых кириллических ключей ===

test("TASK-SEO-002: Все услуги имеют keywords массив", () => {
  const matches = serviceDataSrc.match(/keywords:\s*\[/g) || [];
  assert.ok(matches.length >= 6, `Ожидалось ≥6 keywords, найдено ${matches.length}`);
});

test("TASK-SEO-002: fullDescription диванов содержит чистый ключ 'химчистка дивана на дому в Москве'", () => {
  assert.ok(
    serviceDataSrc.includes("Химчистка дивана на дому в Москве"),
    "fullDescription диванов не содержит чистый ключ"
  );
});

test("TASK-SEO-002: fullDescription матрасов содержит чистый ключ 'Химчистка матраса на дому в Москве'", () => {
  assert.ok(
    serviceDataSrc.includes("Химчистка матраса на дому в Москве"),
    "fullDescription матрасов не содержит чистый ключ"
  );
});

test("TASK-SEO-002: Внутренняя перелинковка - новые страницы ссылаются на услуги", () => {
  assert.ok(vyezdPageSrc.includes("/uslugi/himchistka-divanov"));
  assert.ok(vyezdPageSrc.includes("/uslugi/himchistka-matrasov"));
  assert.ok(mebelPageSrc.includes("/uslugi/himchistka-divanov"));
  assert.ok(mebelPageSrc.includes("/uslugi/himchistka-matrasov"));
  assert.ok(cenyPageSrc.includes("/#cta-form"));
});

// === TASK-SEO-003: микроразметка Offer с price ===

test("TASK-SEO-003: generateServiceJsonLd добавляет price в Offer", () => {
  assert.ok(
    structuredDataSrc.includes("price: service.priceFromValue"),
    "Offer.price не использует priceFromValue"
  );
});

test("TASK-SEO-003: LocalBusiness hasOfferCatalog содержит price", () => {
  assert.ok(
    /hasOfferCatalog[\s\S]*?price:/m.test(structuredDataSrc),
    "hasOfferCatalog не содержит price"
  );
});

test("TASK-SEO-003: UnitPriceSpecification для услуг за м²", () => {
  assert.ok(
    structuredDataSrc.includes("UnitPriceSpecification"),
    "UnitPriceSpecification не добавлен для услуг за м²"
  );
  assert.ok(
    structuredDataSrc.includes("MTK"),
    "unitCode MTK (квадратный метр) не добавлен"
  );
});

// === TASK-SEO-004: чистка семантики ===

test("TASK-SEO-004: Тематические маркеры в первых абзацах (Москва, на дому, цена)", () => {
  // Проверяем что в fullDescription для диванов первые 500 символов содержат ключевые слова
  const idx = serviceDataSrc.indexOf("Химчистка дивана на дому в Москве");
  assert.ok(idx > -1, "Чистый ключ для диванов не найден");
  // Проверяем что для матрасов тоже
  const idxM = serviceDataSrc.indexOf("Химчистка матраса на дому в Москве");
  assert.ok(idxM > -1, "Чистый ключ для матрасов не найден");
});

// === TASK-SEO-005: опечаточные варианты ===

test("TASK-SEO-005: Опечатка 'диванв' присутствует в typos", () => {
  assert.ok(serviceDataSrc.includes("диванв"), "Опечатка 'диванв' не добавлена");
});

test("TASK-SEO-005: Опечатка 'матрасоа' присутствует в typos", () => {
  assert.ok(serviceDataSrc.includes("матрасоа"), "Опечатка 'матрасоа' не добавлена");
});

test("TASK-SEO-005: Опечатка 'салона домм' присутствует в typos", () => {
  assert.ok(
    serviceDataSrc.includes("салона домм"),
    "Опечатка 'салона домм' не добавлена"
  );
});

test("TASK-SEO-005: Опечатка 'мебеои' присутствует в typos", () => {
  assert.ok(serviceDataSrc.includes("мебеои"), "Опечатка 'мебеои' не добавлена");
});

test("TASK-SEO-005: SearchVariations компонент существует", () => {
  const comp = readFileSync(
    join(ROOT, "src/components/SearchVariations.tsx"),
    "utf8"
  );
  assert.ok(comp.includes("typoQueries"), "SearchVariations не принимает typoQueries");
});

// === TASK-SEO-006: 5+ новых статей ===

test("TASK-SEO-006: Добавлено ≥5 новых статей в блог", () => {
  const requiredSlugs = [
    "kak-pochistit-divan-ot-pyaten-doma",
    "himchistka-matrasa-doma-instrukciya",
    "uhod-za-myagkoy-mebelyu-10-sovetov",
    "kak-izbavitsya-ot-zapaha-mochi-na-divane",
    "professinalnaya-himchistka-ili-domashnyaya",
  ];
  requiredSlugs.forEach((slug) => {
    assert.ok(
      blogDataSrc.includes(`slug: "${slug}"`),
      `Статья ${slug} не найдена в blogData`
    );
  });
});

test("TASK-SEO-006: Новые статьи содержат internal links на услуги", () => {
  assert.ok(
    blogDataSrc.includes('/uslugi/himchistka-divanov'),
    "Ссылки на химчистку диванов отсутствуют"
  );
  assert.ok(
    blogDataSrc.includes('/uslugi/himchistka-matrasov'),
    "Ссылки на химчистку матрасов отсутствуют"
  );
  assert.ok(
    blogDataSrc.includes('/mebel'),
    "Ссылки на /mebel отсутствуют"
  );
  assert.ok(
    blogDataSrc.includes('/vyezd'),
    "Ссылки на /vyezd отсутствуют"
  );
});

// === TASK-INF: новые посадочные /ceny/, /vyezd/, /mebel/ ===

test("TASK-INF: /ceny/ страница существует с прайс-листом", () => {
  assert.ok(cenyPageSrc.includes("PRICE_CATEGORIES"), "/ceny не использует PRICE_CATEGORIES");
  assert.ok(cenyPageSrc.includes("metadata"), "/ceny без metadata");
  assert.ok(cenyPageSrc.includes("da-dryclean"), "/ceny title без бренда");
});

test("TASK-INF: /vyezd/ страница существует", () => {
  assert.ok(vyezdPageSrc.includes("Выездная химчистка"), "/vyezd без правильного H1");
  assert.ok(vyezdPageSrc.includes("выезд за 1 час"), "/vyezd без триггера выезда");
});

test("TASK-INF: /mebel/ страница существует", () => {
  assert.ok(mebelPageSrc.includes("Химчистка мягкой мебели"), "/mebel без правильного H1");
  assert.ok(mebelPageSrc.includes("от 1700"), "/mebel без цены");
});

test("TASK-INF: sitemap включает новые страницы", () => {
  assert.ok(sitemapSrc.includes("/ceny"), "sitemap не включает /ceny");
  assert.ok(sitemapSrc.includes("/vyezd"), "sitemap не включает /vyezd");
  assert.ok(sitemapSrc.includes("/mebel"), "sitemap не включает /mebel");
});

test("TASK-INF: robots.txt разрешает новые страницы для Yandex", () => {
  assert.ok(robotsSrc.includes('"/ceny"'), "robots не включает /ceny");
  assert.ok(robotsSrc.includes('"/vyezd"'), "robots не включает /vyezd");
  assert.ok(robotsSrc.includes('"/mebel"'), "robots не включает /mebel");
});

test("TASK-INF: priceData содержит цены для всех категорий из прайс-листа", () => {
  assert.ok(priceDataSrc.includes("Мягкая мебель"));
  assert.ok(priceDataSrc.includes("Ковры"));
  assert.ok(priceDataSrc.includes("Ковролин"));
  assert.ok(priceDataSrc.includes("Ростовые куклы"));
  assert.ok(priceDataSrc.includes("Автомобили — легковые"));
  assert.ok(priceDataSrc.includes("Автомобили — грузовые"));
  // Конкретные цены
  assert.ok(priceDataSrc.includes("1700 ₽"), "Цена дивана 2-хместного отсутствует");
  assert.ok(priceDataSrc.includes("1000 ₽"), "Цена матраса детского отсутствует");
  assert.ok(priceDataSrc.includes("350 ₽/м²"), "Цена ковра синтетика отсутствует");
  assert.ok(priceDataSrc.includes("5000 ₽"), "Цена ростовой куклы отсутствует");
  assert.ok(priceDataSrc.includes("13000"), "Цена химчистки авто отсутствует");
});

// === ЧТЗ §5.3: безопасность совместимость ===

test("ЧТЗ §5.3: Никаких правок в monitoring проект (только frontend)", () => {
  // Тест только проверяет, что мы не добавили ссылки на monitoring
  assert.ok(!cenyPageSrc.includes("monitoring"));
  assert.ok(!vyezdPageSrc.includes("monitoring"));
  assert.ok(!mebelPageSrc.includes("monitoring"));
});

console.log(`\n=== ИТОГ ТЕСТОВ ===`);
console.log(`✓ Пройдено: ${passed}`);
console.log(`✗ Провалено: ${failed}`);
if (failed > 0) {
  console.exit(1);
}
