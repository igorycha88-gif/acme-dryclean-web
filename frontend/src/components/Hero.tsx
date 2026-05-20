"use client";

import { useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Hero() {
  const [address, setAddress] = useState("");

  return (
    <section className="relative bg-primary text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
      <Container className="relative z-10 py-20 max-md:py-12">
        <div className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-5xl leading-[56px] max-md:text-[32px] max-md:leading-10">
            Профессиональная выездная химчистка в&nbsp;Москве и&nbsp;МО
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl max-md:text-base">
            Мебель, ковры, матрасы, автомобили — приедем, почистим, вернём как
            новый. Без предоплаты.
          </p>

          <div className="mt-8 flex gap-3 max-md:flex-col">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Введите адрес или район"
              aria-label="Адрес или район"
              className="flex-1 h-12 rounded-[28px] px-6 text-text-primary bg-white placeholder:text-text-secondary outline-none"
            />
            <Button variant="primary">
              Вызвать мастера
              <ArrowRight size={16} />
            </Button>
          </div>

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
