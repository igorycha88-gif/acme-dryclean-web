"use client";

import { useState } from "react";
import { Send, Phone } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { CONTACTS, SERVICES } from "@/lib/constants";
import { createOrder } from "@/lib/api";
import { trackFormSubmit } from "@/lib/tracker";

export default function CTAForm() {
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
        trackFormSubmit("cta", form.serviceType || undefined, true);
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
        trackFormSubmit("cta", form.serviceType || undefined, true);
        setStatus("sent");
      }
      setForm({ name: "", phone: "", serviceType: "" });
    } catch {
      trackFormSubmit("cta", form.serviceType || undefined, false);
      setStatus("error");
    }
  };

  return (
    <Section id="cta-form" className="bg-primary text-white">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Оставьте заявку — приедем в удобное время!
        </h2>

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
            {status === "sending" ? "Отправка..." : "Отправить"}
            {status !== "sending" && <Send size={16} />}
          </Button>
        </form>

        {status === "sent" && (
          <p className="mt-4 text-center text-success text-sm">
            Заявка отправлена! Мы свяжемся с вами в ближайшее время.
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-center text-accent text-sm">
            Ошибка отправки. Позвоните нам напрямую.
          </p>
        )}

        <p className="mt-6 text-center text-sm text-white/60">
          или позвоните:{" "}
          <a
            href={`tel:${CONTACTS.phoneRaw}`}
            className="inline-flex items-center gap-1 text-white hover:text-secondary transition-colors"
          >
            <Phone size={14} />
            {CONTACTS.phone}
          </a>
        </p>
      </Container>
    </Section>
  );
}
