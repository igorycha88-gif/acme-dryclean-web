#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(process.cwd(), "src");
const FORBIDDEN = /езинфекц/i;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      const content = readFileSync(full, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (FORBIDDEN.test(line)) {
          violations.push(`${full}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

const violations = [];
walk(SRC);

if (violations.length) {
  console.error(`\n✗ Найдено запрещённое слово «дезинфекция» (требует документов):`);
  violations.forEach((v) => console.error("  " + v));
  console.error(`\nВсего: ${violations.length}. Удалите все вхождения.\n`);
  process.exit(1);
}

console.log("✓ Запрещённое слово «дезинфекция» не найдено в frontend/src.");
process.exit(0);
