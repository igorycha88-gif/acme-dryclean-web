import { describe, expect, it } from "vitest";
import { escapeHtml, parsePayload, serviceTitle } from "./helpers";

describe("parsePayload", () => {
  it("принимает валидную заявку", () => {
    expect(
      parsePayload({
        name: "Иван",
        phone: "+7 999 123-45-67",
        service_type: "himchistka-divanov",
      })
    ).toEqual({
      name: "Иван",
      phone: "+7 999 123-45-67",
      service_type: "himchistka-divanov",
    });
  });

  it.each([
    ["пустое тело", null],
    ["не объект", "string"],
    ["пустое имя", { name: "", phone: "+79991234567", service_type: "x" }],
    ["имя > 100 символов", { name: "a".repeat(101), phone: "+79991234567", service_type: "x" }],
    ["имя не строка", { name: 123, phone: "+79991234567", service_type: "x" }],
    ["пустой телефон", { name: "Иван", phone: "", service_type: "x" }],
    ["телефон без цифр", { name: "Иван", phone: "abcdef", service_type: "x" }],
    ["телефон слишком длинный", { name: "Иван", phone: "1".repeat(21), service_type: "x" }],
    ["пустая услуга", { name: "Иван", phone: "+79991234567", service_type: "" }],
    ["услуга не строка", { name: "Иван", phone: "+79991234567", service_type: null }],
    ["нет полей", {}],
  ])("отклоняет: %s", (_label, body) => {
    expect(parsePayload(body)).toBeNull();
  });

  it("обрезает пробелы", () => {
    const payload = parsePayload({
      name: "  Иван  ",
      phone: " +79991234567 ",
      service_type: " himchistka-divanov ",
    });
    expect(payload).toEqual({
      name: "Иван",
      phone: "+79991234567",
      service_type: "himchistka-divanov",
    });
  });

  it("удаляет CR/LF и управляющие символы из service_type (header injection)", () => {
    const payload = parsePayload({
      name: "Иван",
      phone: "+79991234567",
      service_type: "divan\r\nBcc: victim@example.com",
    });
    expect(payload?.service_type).toBe("divan Bcc: victim@example.com");
    expect(payload?.service_type).not.toMatch(/[\r\n]/);
  });

  it("удаляет управляющие символы из name", () => {
    const payload = parsePayload({
      name: "Иван\r\n\u0000Петров",
      phone: "+79991234567",
      service_type: "divan",
    });
    expect(payload?.name).toBe("Иван Петров");
  });
});

describe("escapeHtml", () => {
  it("экранирует HTML-специальные символы", () => {
    expect(escapeHtml(`<script>alert("x&'")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&amp;&#39;&quot;)&lt;/script&gt;"
    );
  });

  it("не меняет безопасную строку", () => {
    expect(escapeHtml("Иван +7 999")).toBe("Иван +7 999");
  });
});

describe("serviceTitle", () => {
  it("возвращает название для известного slug", () => {
    expect(serviceTitle("himchistka-divanov")).toBe("Химчистка диванов");
  });

  it("возвращает slug как есть для неизвестного", () => {
    expect(serviceTitle("unknown-slug")).toBe("unknown-slug");
  });
});
