// Проверки Hero на мобильной версии: телефоны после «Оплата по факту», форма после телефонов (ЧТЗ_Hero_телефоны_мобильные.md)
// Запуск: node tests/hero-mobile-phones.test.mjs

import assert from "node:assert/strict";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const heroSrc = readFileSync(join(ROOT, "src/components/Hero.tsx"), "utf8");
const constantsSrc = readFileSync(join(ROOT, "src/lib/constants.ts"), "utf8");

// 1. Мобильная перестановка: обёртка — flex-col на max-md
assert.match(
  heroSrc,
  /max-w-3xl max-md:flex max-md:flex-col/,
  "обёртка Hero — flex-колонка на мобильных"
);

// 2. Порядок блоков на мобиле задаётся CSS order: trust(3) → телефоны(4) → форма(5)
function orderOf(pattern) {
  const m = heroSrc.match(pattern);
  assert.ok(m, `не найден блок: ${pattern}`);
  return Number(m[1]);
}
const trustOrder = orderOf(/text-white\/70 max-md:order-(\d+)/);
const phonesOrder = orderOf(/hidden max-md:flex max-md:flex-col max-md:gap-2 max-md:order-(\d+)/);
const formOrder = orderOf(/max-md:flex-col max-md:order-(\d+) max-md:mt-6/);
assert.ok(trustOrder < phonesOrder && phonesOrder < formOrder,
  `порядок на мобиле: trust-блок(${trustOrder}) → телефоны(${phonesOrder}) → форма(${formOrder})`);

// 3. Блок телефонов скрыт на десктопе
assert.match(
  heroSrc,
  /className="hidden max-md:flex max-md:flex-col max-md:gap-2 max-md:order-4 max-md:mt-4"/,
  "блок телефонов hidden на десктопе"
);

// 4. Два телефона — Button variant="primary" с tel:-ссылками из CONTACTS (как кнопка «Вызвать мастера»)
const phoneButtons = heroSrc.match(
  /<Button\s+variant="primary"\s+href=\{`tel:\$\{CONTACTS\.(phoneRaw|phoneAltRaw)\}`\}\s+className="w-full"\s*>\s*\{CONTACTS\.(phone|phoneAlt)\}\s*<\/Button>/g
);
assert.ok(phoneButtons && phoneButtons.length === 2,
  `два Button-телефона в стиле primary (найдено: ${phoneButtons ? phoneButtons.length : 0})`);
assert.match(heroSrc, /href=\{`tel:\$\{CONTACTS\.phoneRaw\}`\}/,
  "первый телефон — tel: из CONTACTS.phoneRaw");
assert.match(heroSrc, /href=\{`tel:\$\{CONTACTS\.phoneAltRaw\}`\}/,
  "второй телефон — tel: из CONTACTS.phoneAltRaw");

// 5. CONTACTS экспортируется из constants
assert.match(constantsSrc, /export const CONTACTS = \{/,
  "CONTACTS экспортирован из constants.ts");

// 6. Импорт CONTACTS в Hero
assert.match(heroSrc, /import \{ CONTACTS, SERVICES \} from "@\/lib\/constants";/,
  "CONTACTS импортирован в Hero");

console.log("OK: hero mobile phones checks passed");
