import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const sendMailMock = vi.hoisted(() => vi.fn());
const createTransportMock = vi.hoisted(() =>
  vi.fn(() => ({ sendMail: sendMailMock, close: vi.fn() }))
);

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

const { POST } = await import("./route");

const VALID_BODY = {
  name: "Иван",
  phone: "+7 999 123-45-67",
  service_type: "himchistka-divanov",
};

function makeRequest(body: unknown, referer?: string): NextRequest {
  return new NextRequest("http://localhost/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(referer ? { referer } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/orders", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    createTransportMock.mockClear();
    process.env.SMTP_USER = "site@yandex.ru";
    process.env.SMTP_PASS = "app-password";
    process.env.SMTP_TO = "da-drycleaning@yandex.ru";
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_TLS_SERVERNAME;
  });

  afterEach(() => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_TO;
  });

  it("AC-1: отправляет письмо и отвечает 200 {ok, channel: email}", async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: "test" });
    const res = await POST(makeRequest(VALID_BODY, "https://da-dryclean.ru/"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, channel: "email" });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.yandex.ru",
        port: 465,
        secure: true,
        auth: { user: "site@yandex.ru", pass: "app-password" },
      })
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "site@yandex.ru",
        to: "da-drycleaning@yandex.ru",
        subject: "Новая заявка: Химчистка диванов",
      })
    );
    const options = sendMailMock.mock.calls[0][0] as { html: string; text: string };
    expect(options.text).toContain("Иван");
    expect(options.text).toContain("+7 999 123-45-67");
    expect(options.html).toContain("Химчистка диванов");
  });

  it("AC-2: невалидный payload → 400 без вызова SMTP", async () => {
    const res = await POST(makeRequest({ name: "", phone: "abc", service_type: "" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, error: "validation_failed" });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("битый JSON → 400", async () => {
    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, error: "invalid_json" });
  });

  it("AC-4: ошибка SMTP → 502 email_failed, секрет не в ответе", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("Login failed: app-password leaked"));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data).toEqual({ ok: false, error: "email_failed" });
    expect(JSON.stringify(data)).not.toContain("app-password");
  });

  it("AC-3: без SMTP_USER/SMTP_PASS → легаси-проксирование", async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "1" }), { status: 200 }));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: "1" });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/orders"),
      expect.objectContaining({ method: "POST" })
    );
    expect(sendMailMock).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("AC-3: легаси-прокси при недоступном шлюзе → 500", async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("fetch failed"));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to create order" });
    fetchSpy.mockRestore();
  });

  it("транспорт создаётся с таймаутами (защита от зависания запроса)", async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: "test" });
    await POST(makeRequest(VALID_BODY));
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      })
    );
  });

  it("BUG-002: SNI-override — при SMTP_HOST=IP-ретранслятору сертификат валидируется по SMTP_TLS_SERVERNAME", async () => {
    process.env.SMTP_HOST = "172.22.0.1";
    process.env.SMTP_TLS_SERVERNAME = "smtp.yandex.ru";
    sendMailMock.mockResolvedValueOnce({ messageId: "test" });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "172.22.0.1",
        tls: { servername: "smtp.yandex.ru" },
      })
    );
  });

  it("BUG-002: без SMTP_TLS_SERVERNAME servername = host (прямое подключение)", async () => {
    process.env.SMTP_HOST = "smtp.yandex.ru";
    sendMailMock.mockResolvedValueOnce({ messageId: "test" });
    await POST(makeRequest(VALID_BODY));
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.yandex.ru",
        tls: { servername: "smtp.yandex.ru" },
      })
    );
  });

  it("несколько получателей в SMTP_TO пробрасываются в письмо", async () => {
    process.env.SMTP_TO = "igorycha.s@yandex.ru,da-drycleaning@mail.ru";
    sendMailMock.mockResolvedValueOnce({ messageId: "test" });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "igorycha.s@yandex.ru,da-drycleaning@mail.ru",
      })
    );
  });

  it("referer попадает в письмо, если передан", async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: "test" });
    await POST(makeRequest(VALID_BODY, "https://da-dryclean.ru/services"));
    const options = sendMailMock.mock.calls[0][0] as { text: string };
    expect(options.text).toContain("https://da-dryclean.ru/services");
  });
});
