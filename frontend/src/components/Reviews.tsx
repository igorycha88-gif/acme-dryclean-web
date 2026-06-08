"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { REVIEWS, CONTACTS } from "@/lib/constants";

export default function Reviews() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((p) => (p + 1) % REVIEWS.length);
  const prev = () => setCurrent((p) => (p - 1 + REVIEWS.length) % REVIEWS.length);

  return (
    <Section id="reviews">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Отзывы о нашей работе
        </h2>

        <div className="mt-12 hidden md:grid grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-gray-100 bg-white p-6"
            >
              <div className="flex gap-0.5">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="text-warning fill-warning"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-text-primary">
                &laquo;{review.text}&raquo;
              </p>
              <p className="mt-4 text-sm text-text-secondary">
                — {review.author}, {review.service}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 md:hidden relative">
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex gap-0.5">
              {[...Array(REVIEWS[current].rating)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className="text-warning fill-warning"
                />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-primary">
              &laquo;{REVIEWS[current].text}&raquo;
            </p>
            <p className="mt-4 text-sm text-text-secondary">
              — {REVIEWS[current].author}, {REVIEWS[current].service}
            </p>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={prev}
              className="rounded-full p-2 bg-bg-alt hover:bg-gray-200 transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "w-6 bg-accent" : "w-2 bg-gray-300"
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="rounded-full p-2 bg-bg-alt hover:bg-gray-200 transition-colors"
              aria-label="Next review"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-sm">
          <a
            href={CONTACTS.yandexMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary border-b border-dashed border-secondary hover:text-accent hover:border-accent transition-colors"
          >
            Все отзывы
          </a>
          <a
            href={CONTACTS.yandexMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-secondary hover:text-accent transition-colors"
          >
            <Star size={14} className="text-warning fill-warning" />
            Рейтинг на Яндекс Картах
          </a>
          <a
            href={CONTACTS.yandexMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-white rounded-[28px] h-10 px-6 font-[family-name:var(--font-heading)] font-semibold text-[14px] hover:shadow-[0_6px_20px_rgba(232,69,60,0.3)] hover:-translate-y-px transition-all duration-300"
          >
            <PenLine size={16} />
            Оставить отзыв
          </a>
        </div>
      </Container>
    </Section>
  );
}
