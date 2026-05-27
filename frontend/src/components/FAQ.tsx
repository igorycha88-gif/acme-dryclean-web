"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { FAQ_ITEMS } from "@/lib/constants";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <Section id="faq">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Частые вопросы
        </h2>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-100 bg-white overflow-hidden"
            >
              <button
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
              >
                <span className="font-[family-name:var(--font-heading)] font-semibold text-base">
                  {item.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-text-secondary transition-transform duration-300 ${
                    openIndex === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${idx}`}
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === idx
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 pb-4 text-sm text-text-secondary leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
