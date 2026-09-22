import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrder } from "@/lib/api";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

describe("createOrder", () => {
  it("AC-2: отправляет ровно один POST на /api/orders без задвоенного префикса", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, channel: "email" }), { status: 200 })
    );

    const result = await createOrder({
      name: "Иван",
      phone: "+7 999 123-45-67",
      service_type: "himchistka-divanov",
    });

    expect(result).toEqual({ ok: true, channel: "email" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/orders");
    expect(url).not.toContain("/api/api/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Иван",
      phone: "+7 999 123-45-67",
      service_type: "himchistka-divanov",
    });
  });

  it("AC-2: при не-2xx ответе возвращает null (без fallback-запроса)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "email_failed" }), { status: 502 })
    );

    const result = await createOrder({
      name: "Иван",
      phone: "+7 999 123-45-67",
      service_type: "himchistka-divanov",
    });

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("AC-2: при сетевой ошибке возвращает null", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const result = await createOrder({
      name: "Иван",
      phone: "+7 999 123-45-67",
      service_type: "himchistka-divanov",
    });

    expect(result).toBeNull();
  });
});
