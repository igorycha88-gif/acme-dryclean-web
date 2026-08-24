import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { Phone, ArrowRight, CheckCircle, ShieldCheck, Clock } from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { CONTACTS } from "@/lib/constants";
import {
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
  generateFAQPageJsonLd,
  generateServiceJsonLd,
} from "@/lib/structuredData";
import { SERVICES_DATA } from "@/lib/serviceData";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title:
    "Химчистка мягкой мебели на дому в Москве — цена от 1700 ₽, выезд | da-dryclean",
  description:
    "Профессиональная химчистка мягкой мебели на дому в Москве: диваны, кресла, стулья, пуфики. Удаление пятен, запахов, восстановление цвета. Выезд мастера за 1 час. Цена от 1700 ₽. Без предоплаты. Звоните: +7 (495) 226-15-73.",
  alternates: {
    canonical: `${SITE_URL}/mebel`,
  },
  keywords: [
    "химчистка мягкой мебели на дому москва",
    "химчистка мебели на дому москва",
    "чистка мягкой мебели москва",
    "химчистка мебели с выездом москва",
    "профессиональная химчистка мебели москва",
    "химчистка мебели на дому цена москва",
    "чистка мебели от пятен москва",
  ],
  openGraph: {
    title:
      "Химчистка мягкой мебели на дому в Москве — цена от 1700 ₽, выезд | da-dryclean",
    description:
      "Профессиональная химчистка мягкой мебели на дому в Москве. Диваны, кресла, стулья. Удаление пятен и запахов. Цена от 1700 ₽. Без предоплаты.",
    url: `${SITE_URL}/mebel`,
    type: "website",
  },
};

const SOFA = SERVICES_DATA["himchistka-divanov"];

const FAQ = [
  {
    question: "Сколько стоит химчистка мягкой мебели в Москве?",
    answer:
      "Стоимость зависит от типа и размера мебели. Химчистка дивана — от 1700 ₽, кресла — от 800 ₽, стула — от 350 ₽. Точную стоимость мастер озвучит после осмотра.",
  },
  {
    question: "Выезд мастера по Москве бесплатно?",
    answer:
      "Да, выезд мастера в пределах МКАД — бесплатно. Стоимость выезда за МКАД уточняйте у менеджера. Срочный выезд — в течение 1–2 часов.",
  },
  {
    question: "Безопасна ли химия для детей и животных?",
    answer:
      "Да, мы используем профессиональные гипоаллергенные средства, безопасные для детей и домашних животных. После чистки остатки химии полностью удаляются экстрактором.",
  },
  {
    question: "Нужна ли предоплата?",
    answer:
      "Нет, оплата только по факту выполнения работ и вашей приёмки результата. Если результат не устроит — бесплатно переделаем или вернём деньги.",
  },
  {
    question: "Сколько сохнет мебель после химчистки?",
    answer:
      "Диваны и кресла сохнут 2–4 часа, ковры — 3–6 часов, ковролин — 4–6 часов. Можно ускорить сушку, открыв окно или включив вентиляцию.",
  },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Удаление сложных пятен",
    description:
      "Пятна от кофе, вина, жира, крови, мочи — удаляем 95% загрязнений с первого раза",
  },
  {
    icon: Clock,
    title: "Быстрая сушка 2–4 часа",
    description:
      "Мощное экстракторное оборудование Karcher сокращает время сушки до минимума",
  },
  {
    icon: CheckCircle,
    title: "Безопасная химия",
    description:
      "Гипоаллергенные профессиональные средства, безопасные для детей и животных",
  },
  {
    icon: ShieldCheck,
    title: "Гарантия результата",
    description:
      "Если результат вас не устроит — бесплатно переделаем или вернём деньги",
  },
];

export default function MebelPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Химчистка мягкой мебели", url: "/mebel" },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();
  const faqJsonLd = generateFAQPageJsonLd(FAQ);
  const serviceJsonLd = generateServiceJsonLd("himchistka-divanov");

  return (
    <>
      <Script
        id="structured-data-breadcrumb-mebel"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="structured-data-local-business-mebel"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Script
        id="structured-data-faq-mebel"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {serviceJsonLd && (
        <Script
          id="structured-data-service-mebel"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      )}
      <TopBar />
      <Navigation />
      <main>
        <section className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <nav
              className="text-sm text-white/50 mb-6"
              aria-label="Навигация по странице"
            >
              <Link href="/" className="hover:text-white/80 transition-colors">
                Главная
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-white/70">Химчистка мягкой мебели</span>
            </nav>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
                  Химчистка мягкой мебели на дому в&nbsp;Москве
                </h1>
                <p className="mt-4 text-base text-white/80 sm:text-lg">
                  Профессиональная выездная химчистка мягкой мебели
                  в&nbsp;Москве и&nbsp;Московской области. Диваны, кресла,
                  стулья, пуфики. Удаление пятен, запахов, восстановление цвета.
                  Выезд мастера в&nbsp;течение часа, безопасная химия, гарантия
                  результата.
                </p>
                <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  Цена от&nbsp;1700&nbsp;₽ &middot; Выезд бесплатно
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button
                    variant="secondary"
                    href="#cta-mebel"
                    className="!border-white !text-white hover:!bg-white hover:!text-primary"
                  >
                    Заказать химчистку
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
              {SOFA && (
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  <Image
                    src={SOFA.heroImage}
                    alt="Химчистка мягкой мебели на дому в Москве — профессиональная чистка дивана с выездом"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
              )}
            </div>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-[26px] leading-8 sm:text-3xl sm:leading-[40px]">
                О&nbsp;химчистке мягкой мебели
              </h2>
              <div className="mt-6 text-text-secondary leading-relaxed space-y-4">
                <p>
                  Химчистка мягкой мебели на&nbsp;дому в&nbsp;Москве
                  &mdash; это профессиональная услуга по&nbsp;очистке диванов,
                  кресел, стульев, пуфиков и&nbsp;других предметов мягкой мебели
                  с&nbsp;выездом мастера на&nbsp;дом. Мы&nbsp;работаем
                  с&nbsp;любыми типами обивки: ткань, велюр, флок, букле, шенилл,
                  рогожка, экокожа.
                </p>
                <p>
                  Наши мастера используют профессиональное оборудование Karcher
                  и&nbsp;экологичные чистящие средства, которые безопасны
                  для&nbsp;детей и&nbsp;домашних животных. Экстракторный метод
                  позволяет удалить до&nbsp;95% загрязнений: пятна от&nbsp;еды
                  и&nbsp;напитков, следы от&nbsp;животных, жирные загрязнения,
                  пыль и&nbsp;аллергены.
                </p>
                <p>
                  После чистки мебель сохнет 2–4&nbsp;часа и&nbsp;выглядит
                  как&nbsp;новая. Выезд мастера по&nbsp;Москве &mdash;
                  бесплатно. Оплата только по&nbsp;факту выполнения работ.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Почему выбирают нашу химчистку мебели
            </h2>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="rounded-xl border border-gray-100 bg-white p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <Icon size={24} />
                    </div>
                    <h3 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Что мы чистим
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/uslugi/himchistka-divanov"
                className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                  Диваны
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Прямые, угловые, П-образные, модульные. Все типы обивки.
                </p>
                <p className="mt-3 text-base font-semibold text-secondary">
                  от 1700 ₽
                </p>
              </Link>
              <Link
                href="/ceny"
                className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                  Кресла и&nbsp;стулья
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Кресла текстильные, кресло-кровать, офисные кресла, стулья.
                </p>
                <p className="mt-3 text-base font-semibold text-secondary">
                  от 350 ₽
                </p>
              </Link>
              <Link
                href="/uslugi/himchistka-matrasov"
                className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                  Матрасы
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Дезинфекция и&nbsp;чистка матрасов всех размеров. Удаление
                  клещей.
                </p>
                <p className="mt-3 text-base font-semibold text-secondary">
                  от 1000 ₽
                </p>
              </Link>
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Частые вопросы о&nbsp;химчистке мебели
            </h2>
            <div className="mt-10 max-w-3xl mx-auto space-y-4">
              {FAQ.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-100 bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-[family-name:var(--font-heading)] font-semibold text-lg max-md:text-base [&::-webkit-details-marker]:hidden list-none">
                    {item.question}
                  </summary>
                  <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </Container>
        </Section>

        <section id="cta-mebel" className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] max-md:text-[26px] max-md:leading-8">
                Закажите химчистку мягкой мебели в&nbsp;Москве
              </h2>
              <p className="mt-3 text-white/70">
                Оставьте заявку &mdash; перезвоним в&nbsp;течение 15&nbsp;минут
                и&nbsp;согласуем удобное время. Без предоплаты.
              </p>
              <div className="mt-8 flex justify-center gap-4 max-md:flex-col max-md:items-center">
                <Button variant="primary" href={`tel:${CONTACTS.phoneRaw}`}>
                  <Phone size={16} />
                  {CONTACTS.phone}
                </Button>
                <Button
                  variant="secondary"
                  href="/#cta-form"
                  className="!border-white !text-white hover:!bg-white hover:!text-primary"
                >
                  Оставить заявку
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
