// Регрессионные тесты SEO-инвариантов сайта (актуализировано 15.09.2026)
// Запуск: node tests/seo.test.mjs
// История: тесты TASK-SEO-001..006 из ЧТЗ_Seo_Рекомендации_v1 адаптированы
// после удаления страниц цен (коммит ae53e61) и реализации ЧТЗ v2
// (цены возвращены в формате priceFrom/priceTable на посадочных).

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
const sitemapSrc = readFileSync(join(ROOT, "src/app/sitemap.ts"), "utf8");
const robotsSrc = readFileSync(join(ROOT, "src/app/robots.ts"), "utf8");
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

// === REG-SEO-001: цены в формате ЧТЗ v2 (priceFrom + priceTable) ===

test("REG-SEO-001: priceFrom содержит ₽ и цену, priceFromValue > 0", () => {
  const matches = serviceDataSrc.match(/priceFrom: "([^"]+)"/g) || [];
  assert.ok(matches.length >= 8, `Ожидалось ≥8 priceFrom, найдено ${matches.length}`);
  matches.forEach((m) => {
    const val = m.match(/"([^"]+)"/)[1];
    assert.ok(val.includes("₽"), `priceFrom без ₽: ${val}`);
  });
  const values = serviceDataSrc.match(/priceFromValue: (\d+)/g) || [];
  assert.strictEqual(matches.length, values.length, "Кол-во priceFrom и priceFromValue не совпадает");
  values.forEach((m) => {
    const val = parseInt(m.match(/(\d+)/)[1], 10);
    assert.ok(val > 0, `priceFromValue должен быть > 0, получил ${val}`);
  });
});

test("REG-SEO-001: seoTitle услуг с priceFrom содержит ₽ и Москву", () => {
  // Разбиваем файл на блоки услуг и проверяем связку
  const blocks = serviceDataSrc.split(/^  "/m).slice(1);
  let checked = 0;
  blocks.forEach((block) => {
    const priceFrom = block.match(/priceFrom: "([^"]+)"/);
    const seoTitle = block.match(/seoTitle:\s*\n?\s*"([^"]+)"/);
    if (priceFrom) {
      checked++;
      assert.ok(seoTitle, "Услуга с priceFrom без seoTitle");
      const title = seoTitle[1];
      assert.ok(
        title.toLowerCase().includes("москв") || title.includes("МО") || title.includes("Московск"),
        `seoTitle без гео: ${title}`
      );
    }
  });
  assert.ok(checked >= 8, `Проверено услуг с priceFrom: ${checked} (ожидалось ≥8)`);
});

test("REG-SEO-001: все seoDescription содержат телефон", () => {
  const matches = serviceDataSrc.match(/seoDescription:\s*\n?\s*"([^"]+)"/g) || [];
  assert.ok(matches.length >= 15, `Ожидалось ≥15 seoDescription, найдено ${matches.length}`);
  matches.forEach((m) => {
    const val = m.match(/"([^"]+)"/)[1];
    assert.ok(val.includes("+7"), `seoDescription без телефона: ${val}`);
  });
});

// === REG-SEO-002: релевантность чистых кириллических ключей ===

test("REG-SEO-002: Все услуги имеют keywords массив", () => {
  const matches = serviceDataSrc.match(/keywords:\s*\[/g) || [];
  assert.ok(matches.length >= 15, `Ожидалось ≥15 keywords, найдено ${matches.length}`);
});

test("REG-SEO-002: fullDescription диванов содержит чистый ключ", () => {
  assert.ok(
    serviceDataSrc.includes("Химчистка дивана на дому в Москве"),
    "fullDescription диванов не содержит чистый ключ"
  );
});

test("REG-SEO-002: fullDescription матрасов содержит чистый ключ", () => {
  assert.ok(
    serviceDataSrc.includes("Химчистка матраса на дому в Москве"),
    "fullDescription матрасов не содержит чистый ключ"
  );
});

test("REG-SEO-002: Внутренняя перелинковка страниц", () => {
  assert.ok(vyezdPageSrc.includes("/uslugi/himchistka-divanov"));
  assert.ok(vyezdPageSrc.includes("/uslugi/himchistka-matrasov"));
  assert.ok(mebelPageSrc.includes("/uslugi/himchistka-divanov"));
  assert.ok(mebelPageSrc.includes("/uslugi/himchistka-matrasov"));
});

// === REG-SEO-003: микроразметка Service + Offer ===

test("REG-SEO-003: generateServiceJsonLd добавляет Offer с lowPrice", () => {
  assert.ok(
    structuredDataSrc.includes("lowPrice: service.priceFromValue"),
    "Offer.lowPrice не использует priceFromValue"
  );
  assert.ok(
    structuredDataSrc.includes('"@type": "Offer"'),
    "Offer не добавляется в Service JSON-LD"
  );
});

test("REG-SEO-003: FAQPage и BreadcrumbList генераторы на месте", () => {
  assert.ok(structuredDataSrc.includes('generateFAQPageJsonLd'));
  assert.ok(structuredDataSrc.includes('generateBreadcrumbJsonLd'));
});

// === REG-SEO-005: опечаточные варианты ===

test("REG-SEO-005: исторические опечатки присутствуют в typos", () => {
  assert.ok(serviceDataSrc.includes("диванв"), "Опечатка 'диванв' не добавлена");
  assert.ok(serviceDataSrc.includes("матрасоа"), "Опечатка 'матрасоа' не добавлена");
  assert.ok(serviceDataSrc.includes("салона домм"), "Опечатка 'салона домм' не добавлена");
  assert.ok(serviceDataSrc.includes("мебеои"), "Опечатка 'мебеои' не добавлена");
});

test("REG-SEO-005: SearchVariations компонент существует", () => {
  const comp = readFileSync(
    join(ROOT, "src/components/SearchVariations.tsx"),
    "utf8"
  );
  assert.ok(comp.includes("typoQueries"), "SearchVariations не принимает typoQueries");
});

// === REG-SEO-006: статьи блога ===

test("REG-SEO-006: все статьи v1 на месте", () => {
  const requiredSlugs = [
    "kak-chasto-chistit-divan",
    "5-sposobov-udalit-pyatno-s-divana",
    "himchistka-ili-stirka-chehlov",
    "zachem-chistit-matras",
    "ekstraktornaya-chistka-kovrov",
    "uhod-za-rostovoy-kukloy",
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

test("REG-SEO-006: внутренние ссылки в статьях живы", () => {
  assert.ok(blogDataSrc.includes('/uslugi/himchistka-divanov'));
  assert.ok(blogDataSrc.includes('/uslugi/himchistka-matrasov'));
  assert.ok(blogDataSrc.includes('/mebel'));
  assert.ok(blogDataSrc.includes('/vyezd'));
});

// === REG-INF: служебные страницы и индексация ===

test("REG-INF: /vyezd/ страница существует", () => {
  assert.ok(vyezdPageSrc.includes("Выездная химчистка"), "/vyezd без правильного H1");
});

test("REG-INF: /mebel/ страница существует", () => {
  assert.ok(mebelPageSrc.includes("Химчистка мягкой мебели"), "/mebel без правильного H1");
});

test("REG-INF: sitemap включает служебные страницы", () => {
  assert.ok(sitemapSrc.includes("/vyezd"), "sitemap не включает /vyezd");
  assert.ok(sitemapSrc.includes("/mebel"), "sitemap не включает /mebel");
  assert.ok(sitemapSrc.includes("/geo"), "sitemap не включает /geo");
});

test("REG-INF: robots.txt разрешает страницы для Yandex", () => {
  assert.ok(robotsSrc.includes('"/vyezd"'), "robots не включает /vyezd");
  assert.ok(robotsSrc.includes('"/mebel"'), "robots не включает /mebel");
  assert.ok(robotsSrc.includes('"/geo"'), "robots не включает /geo");
});

test("REG-INF: цены из прайс-листа в priceTable", () => {
  assert.ok(serviceDataSrc.includes("1 700 ₽"), "Цена дивана 2-местного отсутствует");
  assert.ok(serviceDataSrc.includes("2 600 ₽"), "Цена углового дивана отсутствует");
  assert.ok(serviceDataSrc.includes("1 000 ₽"), "Цена матраса детского отсутствует");
  assert.ok(serviceDataSrc.includes("350 ₽/м²"), "Цена ковра синтетика отсутствует");
  assert.ok(serviceDataSrc.includes("500 ₽/м²"), "Цена ковра шерсть отсутствует");
  assert.ok(serviceDataSrc.includes("500 ₽"), "Цена офисного кресла отсутствует");
  assert.ok(serviceDataSrc.includes("13 000 ₽"), "Цена химчистки авто отсутствует");
});

console.log(`\n=== ИТОГ ТЕСТОВ ===`);
console.log(`✓ Пройдено: ${passed}`);
console.log(`✗ Провалено: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
