import { describe, expect, it } from "vitest";
import { PHONE_PATTERN } from "@/lib/constants";
import { PHONE_RE } from "@/app/api/orders/helpers";

const vFlagSupported = (() => {
  try {
    new RegExp("a", "v");
    return true;
  } catch {
    return false;
  }
})();

describe("PHONE_PATTERN (HTML input pattern)", () => {
  it("AC-1: компилируется без флага", () => {
    expect(() => new RegExp(PHONE_PATTERN)).not.toThrow();
  });

  it("AC-1: компилируется с флагом u", () => {
    expect(() => new RegExp(PHONE_PATTERN, "u")).not.toThrow();
  });

  it.runIf(vFlagSupported)(
    "AC-1: компилируется с флагом v (Chrome 125+ pattern-атрибут) — регрессия прода",
    () => {
      expect(() => new RegExp(PHONE_PATTERN, "v")).not.toThrow();
    }
  );

  it.runIf(vFlagSupported)("старый невалидный паттерн действительно падает в v-режиме", () => {
    expect(() => new RegExp("[+]?[0-9\\s\\-()]{7,}", "v")).toThrow();
  });

  it.each([
    "+7 999 123-45-67",
    "+7 (495) 226-15-73",
    "88005553535",
    "123-45-67",
  ])("принимает валидный телефон: %s", (phone) => {
    expect(new RegExp(`^(?:${PHONE_PATTERN})$`).test(phone)).toBe(true);
  });

  it.each(["abc", "", "12345", "phone:+7999"])(
    "отклоняет невалидный: %s",
    (phone) => {
      expect(new RegExp(`^(?:${PHONE_PATTERN})$`).test(phone)).toBe(false);
    }
  );
});

describe("PHONE_RE (серверная валидация)", () => {
  it("эквивалентная семантика: принимает форматированный номер", () => {
    expect(PHONE_RE.test("+7 (999) 123-45-67")).toBe(true);
  });

  it("отклоняет больше 20 символов класса (не считая опциональный +)", () => {
    expect(PHONE_RE.test("+7" + "9".repeat(21))).toBe(false);
  });

  it("отклоняет буквы", () => {
    expect(PHONE_RE.test("+7999abc")).toBe(false);
  });
});
