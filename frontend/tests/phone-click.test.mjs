// Проверки трекинга кликов по телефону (ЧТЗ_Сайт_da_dryclean_Полные_Бизнес_Метрики §2.1, ADR-012)
// Запуск: node tests/phone-click.test.mjs

import assert from "node:assert/strict";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const pageTrackerSrc = readFileSync(
  join(ROOT, "src/components/PageTracker.tsx"),
  "utf8"
);
const trackerSrc = readFileSync(join(ROOT, "src/lib/tracker.ts"), "utf8");

// 1. Делегированный обработчик на a[href^='tel:'] с фазой захвата
assert.match(
  pageTrackerSrc,
  /closest\("a\[href\^='tel:'\]"\)/,
  "делегированный селектор tel:-ссылок"
);
assert.match(
  pageTrackerSrc,
  /addEventListener\("click", handleClick, true\)/,
  "обработчик click в фазе захвата (делегирование)"
);

// 2. Debounce: не чаще 1 события на ссылку в 5 секунд
assert.match(
  pageTrackerSrc,
  /PHONE_CLICK_DEBOUNCE_MS = 5000/,
  "константа debounce 5 секунд"
);
assert.match(
  pageTrackerSrc,
  /lastPhoneClickAt\.current\.get\(href\)/,
  "ключ debounce — конкретная ссылка (href)"
);
assert.match(
  pageTrackerSrc,
  /now - last < PHONE_CLICK_DEBOUNCE_MS/,
  "повторный клик в течение окна отбрасывается"
);

// 3. Тип события — click_phone (ADR-012)
assert.match(
  trackerSrc,
  /event_type: "click_phone"/,
  "trackPhoneClick отправляет click_phone"
);
assert.match(
  trackerSrc,
  /\| "click_phone"/,
  "click_phone в словаре event_type"
);

// 4. Номер телефона попадает в payload
assert.match(
  trackerSrc,
  /payload: \{ phone \}/,
  "номер телефона в payload"
);

console.log("OK: phone click tracking checks passed");
