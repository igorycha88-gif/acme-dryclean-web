"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { SERVICES } from "@/lib/constants";
import { createOrder } from "@/lib/api";

export default function Hero() {
  const [form, setForm] = useState({ name: "", phone: "", serviceType: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const result = await createOrder({
        name: form.name,
        phone: form.phone,
        service_type: form.serviceType,
      });
      if (result) {
        setStatus("sent");
      } else {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            service_type: form.serviceType,
          }),
        });
        if (!res.ok) throw new Error();
        setStatus("sent");
      }
      setForm({ name: "", phone: "", serviceType: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="relative bg-primary text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
      <Container className="relative z-10 py-20 max-md:py-12">
        <div className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-5xl leading-[56px] max-md:text-[32px] max-md:leading-10">
            Профессиональная выездная химчистка мебели на&nbsp;дому в&nbsp;Москве и&nbsp;МО
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl max-md:text-base">
            Химчистка диванов, ростовых кукол, ковров, матрасов и салона автомобиля с выездом к вам.
            Без предоплаты. Оплата по факту.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex items-end gap-3 max-md:flex-col"
          >
            <div className="flex-1 w-full">
              <input
                type="text"
                required
                placeholder="Ваше имя"
                aria-label="Ваше имя"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-12 w-full rounded-[28px] px-6 text-text-primary bg-white placeholder:text-text-secondary outline-none"
              />
            </div>
            <div className="flex-1 w-full">
              <input
                type="tel"
                required
                placeholder="Телефон"
                aria-label="Телефон"
                pattern="[+]?[0-9\s\-()]{7,}"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-12 w-full rounded-[28px] px-6 text-text-primary bg-white placeholder:text-text-secondary outline-none"
              />
            </div>
            <div className="flex-1 w-full">
              <select
                required
                aria-label="Тип услуги"
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                className="h-12 w-full rounded-[28px] px-6 pr-10 text-text-primary bg-white outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="">Тип услуги</option>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" disabled={status === "sending"}>
              {status === "sending" ? "Отправка..." : "Вызвать мастера"}
            </Button>
          </form>

          {status === "sent" && (
            <p className="mt-3 text-success text-sm">
              Заявка отправлена! Мы свяжемся с вами в ближайшее время.
            </p>
          )}
          {status === "error" && (
            <p className="mt-3 text-accent text-sm">
              Ошибка отправки. Позвоните нам напрямую.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className="text-warning fill-warning"
                />
              ))}
              <span className="text-white ml-1">4.9</span>
              <span>на Яндекс Картах</span>
            </span>
            <span>5 000+ заказов</span>
            <span>Оплата по факту</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
