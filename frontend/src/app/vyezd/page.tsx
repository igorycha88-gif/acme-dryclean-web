import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { Phone, ArrowRight, Clock, ShieldCheck, MapPin } from "lucide-react";
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
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title:
    "Выездная химчистка на дому в Москве — выезд за 1 час | da-dryclean",
  description:
    "Закажите выездную химчистку с выездом мастера на дом в Москве и МО. Выезд в течение 1 часа, безопасная химия, гарантия результата. Диваны, матрасы, ковры, мебель. Без предоплаты. Звоните: +7 (495) 226-15-73.",
  alternates: {
    canonical: `${SITE_URL}/vyezd`,
  },
  keywords: [
    "выездная химчистка москва",
    "химчистка на дому москва",
    "химчистка с выездом москва",
    "химчистка на дом москва",
    "выездная химчистка мебели москва",
    "срочная химчистка на дому москва",
    "химчистка с выездом мастера москва",
  ],
  openGraph: {
    title:
      "Выездная химчистка на дому в Москве — выезд за 1 час | da-dryclean",
    description:
      "Выездная химчистка мебели, диванов, матрасов, ковров в Москве и МО. Выезд мастера в течение часа. Без предоплаты.",
    url: `${SITE_URL}/vyezd`,
    type: "website",
  },
};

const ADVANTAGES = [
  {
    icon: Clock,
    title: "Выезд за 1 час",
    description:
      "Срочный выезд мастера по Москве в течение 1–2 часов. Стандартный — в удобное для вас время по записи.",
  },
  {
    icon: MapPin,
    title: "Москва и вся МО",
    description:
      "Работаем по всей Москве и Московской области. Выезд в пределах МКАД — бесплатно. За МКАД — по договорённости.",
  },
  {
    icon: ShieldCheck,
    title: "Гарантия результата",
    description:
      "Если результат вас не устроит — бесплатно переделаем или вернём деньги. Оплата только по факту.",
  },
];

const DIRECTIONS = [
  {
    title: "Диваны и мягкая мебель",
    text: "Химчистка диванов, кресел, стульев, пуфиков. Удаление пятен, запахов, восстановление цвета.",
    href: "/uslugi/himchistka-divanov",
  },
  {
    title: "Матрасы",
    text: "Глубокая чистка матрасов. Удаление пылевых клещей, пятен, аллергенов.",
    href: "/uslugi/himchistka-matrasov",
  },
  {
    title: "Ковры",
    text: "Чистка ковров всех типов: шерсть, шёлк, синтетика, вискоза, хлопок.",
    href: "/uslugi/himchistka-kovrov",
  },
  {
    title: "Ковролин",
    text: "Промышленная чистка ковролина в квартирах, офисах, коммерческих помещениях.",
    href: "/uslugi/himchistka-kovrolina",
  },
  {
    title: "Салон автомобиля",
    text: "Полная химчистка салона авто: сиденья, потолок, двери, пластик, багажник.",
    href: "/uslugi/himchistka-salona-avtomobilya",
  },
  {
    title: "Ростовые куклы",
    text: "Чистка ростовых кукол и костюмов. Забор и доставка.",
    href: "/uslugi/himchistka-rostovyh-kukol",
  },
];

export default function VyezdPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Выездная химчистка", url: "/vyezd" },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();

  return (
    <>
      <Script
        id="structured-data-breadcrumb-vyezd"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="structured-data-local-business-vyezd"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
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
              <span className="text-white/70">Выездная химчистка</span>
            </nav>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
              Выездная химчистка на дому в&nbsp;Москве
            </h1>
            <p className="mt-4 text-base text-white/80 sm:text-lg max-w-2xl">
              Профессиональная выездная химчистка мягкой мебели, диванов,
              матрасов, ковров и&nbsp;ковролина с&nbsp;выездом мастера
              на&nbsp;дом в&nbsp;Москве и&nbsp;Московской области. Выезд
              в&nbsp;течение часа, безопасная химия, гарантия результата.
            </p>
            <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Выезд бесплатно &middot; Оплата по&nbsp;факту
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                variant="secondary"
                href="#cta-vyezd"
                className="!border-white !text-white hover:!bg-white hover:!text-primary"
              >
                Заказать выезд
                <ArrowRight size={16} />
              </Button>
            </div>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {ADVANTAGES.map((adv) => {
                const Icon = adv.icon;
                return (
                  <div
                    key={adv.title}
                    className="rounded-xl border border-gray-100 bg-white p-6 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <Icon size={24} />
                    </div>
                    <h2 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg">
                      {adv.title}
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      {adv.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Что мы чистим на дому
            </h2>
            <p className="mt-3 text-center text-text-secondary max-w-2xl mx-auto">
              Полный спектр услуг выездной химчистки в&nbsp;Москве. Выберите
              направление &mdash; узнайте детали, стоимость рассчитает менеджер.
            </p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {DIRECTIONS.map((dir) => (
                <Link
                  key={dir.href}
                  href={dir.href}
                  className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                    {dir.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {dir.text}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                    Подробнее <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
                Как происходит выездная химчистка
              </h2>
              <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                      Заявка и&nbsp;согласование времени
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                      Вы оставляете заявку по&nbsp;телефону или через форму
                      на&nbsp;сайте. Менеджер перезвонит в&nbsp;течение
                      15&nbsp;минут и&nbsp;согласует удобное время выезда мастера.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                      Выезд мастера и&nbsp;осмотр
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                      Мастер приезжает к&nbsp;вам на&nbsp;дом в&nbsp;согласованное
                      время. Осматривает мебель, определяет тип ткани
                      и&nbsp;подбирает оптимальное чистящее средство. Озвучивает
                      финальную стоимость.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                      Чистка профессиональным оборудованием
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                      Мастер проводит глубокую экстракторную чистку
                      с&nbsp;использованием оборудования Karcher
                      и&nbsp;профессиональной химии. Безопасно для детей
                      и&nbsp;животных.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                      Сушка и&nbsp;приёмка
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                      Мебель сохнет 2–6&nbsp;часов в&nbsp;зависимости от&nbsp;типа
                      ткани. Вы проверяете результат и&nbsp;оплачиваете работу
                      по&nbsp;факту. Без предоплаты.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <section id="cta-vyezd" className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] max-md:text-[26px] max-md:leading-8">
                Закажите выездную химчистку в&nbsp;Москве
              </h2>
              <p className="mt-3 text-white/70">
                Перезвоним в&nbsp;течение 15&nbsp;минут и&nbsp;согласуем удобное
                время. Выезд мастера &mdash; бесплатно. Без предоплаты.
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
