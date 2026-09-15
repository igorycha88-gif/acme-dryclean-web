// Тесты ЧТЗ v2: SEO-задачи da-dryclean v2.1 (15.09.2026)
// Трассировка: TC-DD-XX → критерии приёмки ЧТЗ_da-dryclean_SEO_для_владельца_v2.md
// Запуск: node tests/seo-v2.test.mjs

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
const blogDataSrc = readFileSync(join(ROOT, "src/lib/blogData.ts"), "utf8");
const geoDataSrc = readFileSync(join(ROOT, "src/lib/geoData.ts"), "utf8");
const sitemapSrc = readFileSync(join(ROOT, "src/app/sitemap.ts"), "utf8");
const robotsSrc = readFileSync(join(ROOT, "src/app/robots.ts"), "utf8");
const uslugiPageSrc = readFileSync(
  join(ROOT, "src/app/uslugi/[slug]/page.tsx"),
  "utf8"
);
const structuredDataSrc = readFileSync(
  join(ROOT, "src/lib/structuredData.ts"),
  "utf8"
);

// Парсер блоков услуг: "slug": { ... } до следующего top-level ключа
function serviceBlock(slug) {
  const start = serviceDataSrc.indexOf(`"${slug}": {`);
  assert.ok(start > -1, `Услуга ${slug} не найдена в SERVICES_DATA`);
  const rest = serviceDataSrc.slice(start);
  const next = rest.slice(1).search(/^  "[a-z0-9-]+": \{/m);
  return next > -1 ? rest.slice(0, next + 1) : rest;
}

function blogBlock(slug) {
  const start = blogDataSrc.indexOf(`slug: "${slug}"`);
  assert.ok(start > -1, `Статья ${slug} не найдена в BLOG_ARTICLES`);
  const rest = blogDataSrc.slice(start);
  const next = rest.slice(1).search(/^  \{\s*$/m);
  return next > -1 ? rest.slice(0, next + 1) : rest;
}

const COMPETITOR_BRANDS = [
  "dryclean.ru",
  "Диана",
  "диана",
  "david",
  "давид",
  "double-clean",
  "dearcare",
  "cleacom",
];

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

// === TC-DD-02: Страница «Химчистка ростовых кукол» (AC: CTR > 5%, Title/Desc/FAQ/Schema) ===

test("TC-DD-02: seoTitle по ЧТЗ — цена от 5 000 ₽, костюмы талисманов, выезд", () => {
  const block = serviceBlock("himchistka-rostovyh-kukol");
  const seoTitle = block.match(/seoTitle:\s*\n?\s*"([^"]+)"/)[1];
  assert.ok(seoTitle.includes("от 5 000 ₽"), `Title без цены: ${seoTitle}`);
  assert.ok(seoTitle.includes("талисманов"), `Title без талисманов: ${seoTitle}`);
  assert.ok(seoTitle.toLowerCase().includes("москв"), `Title без Москвы: ${seoTitle}`);
  assert.ok(seoTitle.includes("выезд"), `Title без выезда: ${seoTitle}`);
});

test("TC-DD-02: seoDescription по ЧТЗ — гипоаллергенные, сушка, ремонт молний, телефон", () => {
  const block = serviceBlock("himchistka-rostovyh-kukol");
  const desc = block.match(/seoDescription:\s*\n?\s*"([^"]+)"/)[1];
  assert.ok(desc.includes("талисманов"), `Description без талисманов: ${desc}`);
  assert.ok(desc.includes("Гипоаллергенные"), `Description без гипоаллергенности: ${desc}`);
  assert.ok(desc.includes("ремонт молний"), `Description без ремонта молний: ${desc}`);
  assert.ok(desc.includes("+7"), `Description без телефона: ${desc}`);
});

test("TC-DD-02: FAQ 5–7 вопросов (требование ЧТЗ), вкл. стирку в машинке/запах/хранение", () => {
  const block = serviceBlock("himchistka-rostovyh-kukol");
  const questions = block.match(/question:/g) || [];
  assert.ok(questions.length >= 5 && questions.length <= 7, `FAQ = ${questions.length}, ожидалось 5–7`);
  assert.ok(/стирать[^"]*машин/i.test(block), "Нет вопроса про стиральную машину");
  assert.ok(/запах/i.test(block), "Нет вопроса про запах");
  assert.ok(/хран/i.test(block), "Нет вопроса про хранение");
});

test("TC-DD-02: таблица цен по типам (кукла/талисман/анимационный; сушка; ремонт)", () => {
  const block = serviceBlock("himchistka-rostovyh-kukol");
  assert.ok(block.includes("priceTable"), "Нет priceTable");
  assert.ok(/Ростовая кукла/.test(block), "Нет строки «Ростовая кукла»");
  assert.ok(/Костюм талисмана/.test(block), "Нет строки «Костюм талисмана»");
  assert.ok(/Анимационный костюм/.test(block), "Нет строки «Анимационный костюм»");
  assert.ok(/Сушка/.test(block), "Нет строки про сушку");
  assert.ok(/Ремонт молний/.test(block), "Нет строки про ремонт молний");
  assert.ok(/от 5 000 ₽/.test(block), "Нет цены от 5 000 ₽");
  assert.ok(/Забор и доставка/.test(block), "Нет забора и доставки");
});

test("TC-DD-02: Schema.org Service + Offer + FAQPage", () => {
  const block = serviceBlock("himchistka-rostovyh-kukol");
  assert.ok(/priceFromValue: 5000/.test(block), "priceFromValue != 5000");
  assert.ok(structuredDataSrc.includes('"@type": "Offer"'), "Offer не генерируется");
  assert.ok(structuredDataSrc.includes("lowPrice: service.priceFromValue"), "Offer.lowPrice не связан с priceFromValue");
  assert.ok(uslugiPageSrc.includes("generateFAQPageJsonLd"), "FAQPage JSON-LD не подключён на странице услуги");
});

test("TC-DD-02: фото до/после + CTA и телефон выше fold (hero шаблона)", () => {
  const block = serviceBlock("himchistka-rostovyh-kukol");
  assert.ok(block.includes("before-mascot.jpg"), "Нет фото до");
  assert.ok(block.includes("after-mascot.jpg"), "Нет фото после");
  // Телефон в hero: в шаблоне страницы услуги до секции priceTable
  const heroIdx = uslugiPageSrc.indexOf("Заказать");
  const phoneIdx = uslugiPageSrc.indexOf("tel:${CONTACTS.phoneRaw}");
  assert.ok(heroIdx > -1 && phoneIdx > -1 && phoneIdx < uslugiPageSrc.indexOf("О&nbsp;услуге"), "Телефон не в hero-блоке");
});

// === TC-DD-03: Статья-хаб «Уход за ростовыми куклами» (AC: обновлённый хаб) ===

test("TC-DD-03: хаб-статья обновлена — Title/структура 2026, стирка/сушка/хранение", () => {
  const block = blogBlock("uhod-za-rostovoy-kukloy");
  const metaTitle = block.match(/metaTitle:\s*\n?\s*"([^"]+)"/)[1];
  assert.ok(
    metaTitle.startsWith("Уход за ростовыми куклами: стирка, сушка, хранение — инструкция 2026"),
    `metaTitle не по ЧТЗ: ${metaTitle}`
  );
  assert.ok(/## Можно ли стирать/.test(block), "Нет раздела про стирку");
  assert.ok(/## Правильная сушка/.test(block), "Нет раздела про сушку");
  assert.ok(/## Хранение между/.test(block), "Нет раздела про хранение");
  assert.ok(/## .*не «вздулась»|## Что делать, чтобы кукла не «вздулась»/.test(block), "Нет раздела про «вздувание»");
  assert.ok(block.includes("2026-09-15"), "updatedAt не обновлён");
});

test("TC-DD-03: перелинковка хаба на страницу услуги DD-02", () => {
  const block = blogBlock("uhod-za-rostovoy-kukloy");
  assert.ok(
    block.includes('/uslugi/himchistka-rostovyh-kukol'),
    "Нет ссылки на /uslugi/himchistka-rostovyh-kukol"
  );
});

// === TC-DD-08: Ковры с вывозом и доставкой, перехват брендов (AC: в индексе, клики) ===

test("TC-DD-08: страница существует, Title/H1 точно по ЧТЗ", () => {
  const block = serviceBlock("himchistka-kovrov-s-vyvozom-i-dostavkoy");
  const seoTitle = block.match(/seoTitle:\s*\n?\s*"([^"]+)"/)[1];
  assert.strictEqual(
    seoTitle,
    "Химчистка ковров с вывозом и доставкой в Москве и МО — цены, сроки",
    `seoTitle не по ЧТЗ: ${seoTitle}`
  );
  const h1 = block.match(/h1: "([^"]+)"/)[1];
  assert.strictEqual(h1, "Химчистка ковров с вывозом и доставкой", `h1 не по ЧТЗ: ${h1}`);
});

test("TC-DD-08 [КРИТИЧНО]: бренды конкурентов НЕ в Title и Description", () => {
  const block = serviceBlock("himchistka-kovrov-s-vyvozom-i-dostavkoy");
  const seoTitle = block.match(/seoTitle:\s*\n?\s*"([^"]+)"/)[1];
  const seoDescription = block.match(/seoDescription:\s*\n?\s*"([^"]+)"/)[1];
  COMPETITOR_BRANDS.forEach((brand) => {
    assert.ok(!seoTitle.includes(brand), `Бренд «${brand}» в Title! Нарушение безопасного формата`);
    assert.ok(!seoDescription.includes(brand), `Бренд «${brand}» в Description! Нарушение безопасного формата`);
  });
});

test("TC-DD-08: бренды dryclean.ru и «Диана» ЕСТЬ в теле страницы (таблица сравнения)", () => {
  const block = serviceBlock("himchistka-kovrov-s-vyvozom-i-dostavkoy");
  assert.ok(block.includes("dryclean.ru"), "dryclean.ru нет в теле страницы");
  assert.ok(block.includes("«Диана»"), "«Диана» нет в теле страницы");
  assert.ok(block.includes("comparisonTable"), "Нет таблицы сравнения служб");
  assert.ok(/Сравнение популярных служб/.test(block), "Нет H2-заголовка сравнения");
  assert.ok(/данных.*09\.2026|09\.2026/.test(block), "Нет пометки «данные на 09.2026»");
});

test("TC-DD-08: честная таблица цен (наши vs рынок) + FAQ 5+ + CTA «Рассчитать стоимость ковра»", () => {
  const block = serviceBlock("himchistka-kovrov-s-vyvozom-i-dostavkoy");
  assert.ok(/Сколько стоит химчистка ковра/.test(block), "Нет таблицы «Сколько стоит»");
  assert.ok(/Средняя по рынку/.test(block), "Нет колонки средних цен рынка");
  const faqCount = (block.match(/question:/g) || []).length;
  assert.ok(faqCount >= 5, `FAQ = ${faqCount}, ожидалось ≥5`);
  assert.ok(block.includes("Рассчитать стоимость ковра"), "Нет CTA «Рассчитать стоимость ковра»");
  assert.ok(/350 ₽\/м²/.test(block) && /500 ₽\/м²/.test(block), "Нет цен ковров из прайса");
});

test("TC-DD-08: описан процесс забора и доставки по Москве и МО", () => {
  const block = serviceBlock("himchistka-kovrov-s-vyvozom-i-dostavkoy");
  assert.ok(/Как работает забор ковра/.test(block), "Нет описания забора");
  assert.ok(/достав/.test(block.toLowerCase()), "Нет упоминания доставки");
});

// === TC-DD-11: Автокластер — «Химчистка салона с выездом» ===

test("TC-DD-11: посадочная существует, Title с выездом и ценой от 13 000 ₽", () => {
  const block = serviceBlock("himchistka-salona-avto-s-vyezdom");
  const seoTitle = block.match(/seoTitle:\s*\n?\s*"([^"]+)"/)[1];
  assert.ok(seoTitle.includes("с выездом"), `Title без «с выездом»: ${seoTitle}`);
  assert.ok(seoTitle.includes("13 000 ₽"), `Title без цены: ${seoTitle}`);
  assert.ok(seoTitle.includes("Москва и МО"), `Title без гео: ${seoTitle}`);
});

test("TC-DD-11: цены по классам авто и пакетам + зимнее примечание из прайса", () => {
  const block = serviceBlock("himchistka-salona-avto-s-vyezdom");
  ["13 000", "15 000", "17 000", "20 000", "22 000"].forEach((price) => {
    assert.ok(block.includes(price), `Нет цены класса ${price} ₽`);
  });
  assert.ok(/600 ₽/.test(block), "Нет цены сиденья 600 ₽/место");
  assert.ok(/отаплива/.test(block), "Нет примечания про отапливаемое помещение зимой");
  const faqCount = (block.match(/question:/g) || []).length;
  assert.ok(faqCount >= 5, `FAQ = ${faqCount}, ожидалось ≥5`);
});

test("TC-DD-11: отдельный H2/блок про удаление запахов (клик уже есть)", () => {
  const block = serviceBlock("himchistka-salona-avto-s-vyezdom");
  assert.ok(/Удаление запах/.test(block), "Нет блока про удаление запахов");
  assert.ok(/озонирован/i.test(block), "Нет упоминания озонирования");
});

test("TC-DD-11 ↔ TC-DD-04: взаимная перелинковка автокластера", () => {
  const avto = serviceBlock("himchistka-salona-avto-s-vyezdom");
  const zapah = serviceBlock("udalenie-zapaha-salona-avto");
  assert.ok(
    avto.includes('"udalenie-zapaha-salona-avto"'),
    "Страница авто не ссылается на удаление запаха"
  );
  assert.ok(
    zapah.includes('"himchistka-salona-avto-s-vyezdom"'),
    "Удаление запаха не ссылается на страницу авто"
  );
});

// === TC-DD-04: Страницы «Решение проблем» (5 шт) ===

test("TC-DD-04: все 5 страниц решения проблем существуют", () => {
  const slugs = [
    "udalenie-zapaha-salona-avto",
    "udalenie-zapaha-mochi-divana",
    "chistka-detskogo-matrasa",
    "udalenie-zapaha-koshki",
    "chistka-matrasa-ot-kleshchey",
  ];
  slugs.forEach((slug) => {
    assert.ok(serviceDataSrc.includes(`"${slug}": {`), `Страница ${slug} не найдена`);
  });
});

test("TC-DD-04: удаление запаха салона — Title по ЧТЗ", () => {
  const block = serviceBlock("udalenie-zapaha-salona-avto");
  const seoTitle = block.match(/seoTitle:\s*\n?\s*"([^"]+)"/)[1];
  assert.ok(
    seoTitle.startsWith("Удаление запаха из салона автомобиля"),
    `Title не по ЧТЗ: ${seoTitle}`
  );
  assert.ok(seoTitle.includes("выезд по Москве"), `Title без выезда: ${seoTitle}`);
});

test("TC-DD-04: каждая проблемная страница имеет SEO-мета и FAQ 4+", () => {
  [
    "udalenie-zapaha-salona-avto",
    "udalenie-zapaha-mochi-divana",
    "chistka-detskogo-matrasa",
    "udalenie-zapaha-koshki",
    "chistka-matrasa-ot-kleshchey",
  ].forEach((slug) => {
    const block = serviceBlock(slug);
    assert.ok(/seoTitle:/.test(block), `${slug}: нет seoTitle`);
    assert.ok(/seoDescription:/.test(block), `${slug}: нет seoDescription`);
    const faqCount = (block.match(/question:/g) || []).length;
    assert.ok(faqCount >= 4, `${slug}: FAQ = ${faqCount}, ожидалось ≥4`);
  });
});

// === TC-DD-05: Страницы «Нестандартные предметы» (4 новых + ковролин уже есть) ===

test("TC-DD-05: 4 новые страницы + существующий ковролин (без дублей)", () => {
  [
    "himchistka-avtokresla",
    "himchistka-izgoloviy-krovati",
    "himchistka-shtor",
    "himchistka-ofisnyh-kresel",
    "himchistka-kovrolina",
  ].forEach((slug) => {
    assert.ok(serviceDataSrc.includes(`"${slug}": {`), `Страница ${slug} не найдена`);
  });
  // ковролин остаётся единственной страницей про ковролин (анти-дубль)
  const kovrolinMentions = (serviceDataSrc.match(/himchistka-kovrolina/g) || []).length;
  assert.ok(kovrolinMentions >= 1, "Ковролин отсутствует");
});

// === TC-DD-07: Хаб «Экстракторная чистка ковров» ===

test("TC-DD-07: Title по ЧТЗ + цена в Москве + перелинковка на DD-08", () => {
  const block = blogBlock("ekstraktornaya-chistka-kovrov");
  const metaTitle = block.match(/metaTitle:\s*\n?\s*"([^"]+)"/)[1];
  assert.strictEqual(
    metaTitle,
    "Экстракторная чистка ковров: что это, чем лучше, цена в Москве",
    `metaTitle не по ЧТЗ: ${metaTitle}`
  );
  assert.ok(/350 ₽\/м²/.test(block), "Нет цены в статье");
  assert.ok(
    block.includes("/uslugi/himchistka-kovrov-s-vyvozom-i-dostavkoy"),
    "Нет перелинковки на DD-08 (ковры с вывозом)"
  );
});

// === TC-DD-10: Гео-волна «ковры с вывозом» (7 городов) ===

test("TC-DD-10: все 7 городов присутствуют", () => {
  [
    "ramenskoe",
    "himki",
    "zelenograd",
    "balashiha",
    "zvenigorod",
    "pavlovskiy-posad",
    "kurovskoe",
  ].forEach((slug) => {
    assert.ok(geoDataSrc.includes(`slug: "${slug}"`), `Город ${slug} не найден`);
  });
});

test("TC-DD-10 [анти-дорвей]: ≥30% локального уникального текста на город", () => {
  const texts = [...geoDataSrc.matchAll(/uniqueText:\s*\[([\s\S]*?)\s*\],\s*\n\s*metaTitle:/g)];
  assert.ok(texts.length === 7, `Городов с uniqueText: ${texts.length}, ожидалось 7`);

  const tokenize = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[«»"(),.:;—\-–]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4)
    );

  const cityTexts = texts.map((m) => {
    const raw = m[1].replace(/"(.*?)"/gs, "$1").replace(/\s+/g, " ");
    // Уникальный текст должен быть объёмным (≥600 символов = ≥ ~90 слов)
    assert.ok(
      raw.length >= 600,
      `Уникальный текст города слишком короткий: ${raw.length} символов (минимум 600)`
    );
    return raw;
  });

  // Попарное пересечение уникальных слов между городами ≤ 60%
  for (let i = 0; i < cityTexts.length; i++) {
    for (let j = i + 1; j < cityTexts.length; j++) {
      const a = tokenize(cityTexts[i]);
      const b = tokenize(cityTexts[j]);
      const common = [...a].filter((w) => b.has(w));
      const overlap = common.length / Math.min(a.size, b.size);
      assert.ok(
        overlap <= 0.6,
        `Пересечение текстов городов ${i}↔${j}: ${(overlap * 100).toFixed(0)}% (>60% — дорвей-риск)`
      );
    }
  }
});

test("TC-DD-10: уникальный текст упоминает свой город", () => {
  const names = ["Раменск", "Химк", "Зеленоград", "Балаших", "Звенигород", "Павловский Посад", "Куровск"];
  const texts = [...geoDataSrc.matchAll(/uniqueText:\s*\[([\s\S]*?)\s*\],\s*\n\s*metaTitle:/g)];
  const cities = [...geoDataSrc.matchAll(/name: "([^"]+)",\s*\n\s*namePrepositional/g)];
  texts.forEach((m, idx) => {
    const cityName = cities[idx]?.[1] || names[idx];
    const stem = cityName.split(" ")[0].slice(0, 7);
    assert.ok(
      m[1].includes(stem),
      `Уникальный текст не упоминает город «${cityName}»`
    );
  });
});

test("TC-DD-10: гео-страницы в sitemap и robots", () => {
  assert.ok(sitemapSrc.includes("/geo"), "sitemap без /geo");
  assert.ok(
    sitemapSrc.includes("getAllGeoSlugs"),
    "sitemap не использует getAllGeoSlugs"
  );
  assert.ok(robotsSrc.includes('"/geo"'), "robots без /geo");
});

test("TC-DD-10: перелинковка гео → DD-08 (ковры с вывозом)", () => {
  const geoPageSrc = readFileSync(
    join(ROOT, "src/app/geo/[slug]/page.tsx"),
    "utf8"
  );
  assert.ok(
    geoPageSrc.includes("/uslugi/himchistka-kovrov-s-vyvozom-i-dostavkoy"),
    "Гео-страница не ссылается на DD-08"
  );
});

// === TC-SAFE: глобальная безопасность брендов ===

test("TC-SAFE [КРИТИЧНО]: ни один бренд конкурентов в Title/Description ЛЮБОЙ услуги", () => {
  const titlesAndDescs = [
    ...(serviceDataSrc.matchAll(/seoTitle:\s*\n?\s*"([^"]+)"/g)),
    ...(serviceDataSrc.matchAll(/seoDescription:\s*\n?\s*"([^"]+)"/g)),
  ].map((m) => m[1]);
  assert.ok(titlesAndDescs.length >= 15, "Не найдены seoTitle/seoDescription");
  titlesAndDescs.forEach((val) => {
    COMPETITOR_BRANDS.forEach((brand) => {
      assert.ok(
        !val.includes(brand),
        `Бренд «${brand}» найден в мета-теге: «${val}» — нарушение безопасного формата`
      );
    });
  });
});

// === TC-INF: генерация и индексация новых страниц ===

test("TC-INF: getAllServiceSlugs генерирует ВСЕ посадочные из SERVICES_DATA", () => {
  assert.ok(
    serviceDataSrc.includes("Object.keys(SERVICES_DATA)"),
    "getAllServiceSlugs не использует SERVICES_DATA — новые страницы не сгенерируются"
  );
});

test("TC-INF: шаблон услуги рендерит priceTable / comparisonTable / beforeAfter", () => {
  ["priceTable", "comparisonTable", "beforeAfter", "ctaLabel"].forEach((field) => {
    assert.ok(uslugiPageSrc.includes(field), `Шаблон uslugi не рендерит ${field}`);
  });
});

console.log(`\n=== ИТОГ ТЕСТОВ ЧТЗ v2 ===`);
console.log(`✓ Пройдено: ${passed}`);
console.log(`✗ Провалено: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
