"use client";

import { useState, useRef, useCallback } from "react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";

const categories = ["Диваны", "Автомобили", "Матрасы", "Ростовые куклы"];

const beforeAfterData: Record<
  string,
  { before: { src?: string; text: string }; after: { src?: string; text: string } }
> = {
  Диваны: {
    before: { src: "/images/before-before-sofa.jpg", text: "Грязный диван (до)" },
    after: { src: "/images/after-sofa.jpg", text: "Чистый диван (после)" },
  },
  "Ростовые куклы": {
    before: { src: "/images/before-mascot.jpg", text: "Грязная ростовая кукла (до)" },
    after: { src: "/images/after-mascot.jpg", text: "Чистая ростовая кукла (после)" },
  },
  Матрасы: {
    before: { src: "/images/before-mattress.jpg", text: "Грязный матрас (до)" },
    after: { src: "/images/after-mattress.jpg", text: "Чистый матрас (после)" },
  },
  Автомобили: {
    before: { src: "/images/before-car.jpg", text: "Грязный салон (до)" },
    after: { src: "/images/after-car.jpg", text: "Чистый салон (после)" },
  },
};

export default function BeforeAfter() {
  const [activeTab, setActiveTab] = useState(categories[0]);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = () => { dragging.current = true; };
  const handleMouseUp = () => { dragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    handleMove(e.clientX);
  };

  const handleTouchStart = () => { dragging.current = true; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPos((p) => Math.max(0, p - 2));
    } else if (e.key === "ArrowRight") {
      setSliderPos((p) => Math.min(100, p + 2));
    }
  };

  const current = beforeAfterData[activeTab];

  return (
    <Section id="before-after">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Результаты нашей работы
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Переместите ползунок, чтобы увидеть разницу
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm transition-colors duration-300 ${
                activeTab === cat
                  ? "bg-primary text-white"
                  : "bg-bg-alt text-text-primary hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div
          ref={containerRef}
          className="relative mt-8 aspect-[16/9] w-full select-none overflow-hidden rounded-2xl cursor-col-resize"
          role="slider"
          aria-valuenow={Math.round(sliderPos)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Сравнение до и после"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-text-secondary">
            {current.before.src ? (
              <img
                src={current.before.src}
                alt={current.before.text}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              current.before.text
            )}
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center bg-green-50 text-text-secondary"
            style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
          >
            {current.after.src ? (
              <img
                src={current.after.src}
                alt={current.after.text}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              current.after.text
            )}
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
              <span className="text-sm text-primary font-bold">⇔</span>
            </div>
          </div>

          <span className="absolute bottom-4 left-4 rounded bg-black/50 px-2 py-1 text-xs text-white">
            ДО
          </span>
          <span className="absolute bottom-4 right-4 rounded bg-black/50 px-2 py-1 text-xs text-white">
            ПОСЛЕ
          </span>
        </div>
      </Container>
    </Section>
  );
}
