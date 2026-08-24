import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { Phone, ArrowRight, CheckCircle } from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { CONTACTS } from "@/lib/constants";
import { PRICE_CATEGORIES, PRICE_NOTES } from "@/lib/priceData";
import {
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title:
    "Цены на химчистку на дому в Москве — прайс-лист от 1000 ₽ | da-dryclean",
  description:
    "Актуальный прайс-лист на выездную химчистку в Москве: диваны от 1700 ₽, матрасы от 1000 ₽, ковры от 350 ₽/м², ковролин от 220 ₽/м², химчистка авто от 13000 ₽. Выезд бесплатно. Без предоплаты.",
  alternates: {
    canonical: `${SITE_URL}/ceny`,
  },
  keywords: [
    "химчистка на дому цены москва",
    "прайс химчистка москва",
    "химчистка дивана цена москва",
    "химчистка матраса цена москва",
    "химчистка ковра цена москва",
    "стоимость химчистки москва",
    "химчистка на дому сколько стоит",
  ],
  openGraph: {
    title:
      "Цены на химчистку на дому в Москве — прайс-лист от 1000 ₽ | da-dryclean",
    description:
      "Актуальный прайс-лист на выездную химчистку в Москве. Диваны от 1700 ₽, матрасы от 1000 ₽, ковры от 350 ₽/м². Выезд бесплатно.",
    url: `${SITE_URL}/ceny`,
    type: "website",
  },
};

export default function PricesPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Цены", url: "/ceny" },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();

  return (
    <>
      <Script
        id="structured-data-breadcrumb-prices"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="structured-data-local-business-prices"
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
              <span className="text-white/70">Цены</span>
            </nav>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
              Цены на химчистку на дому в&nbsp;Москве
            </h1>
            <p className="mt-4 text-base text-white/80 sm:text-lg max-w-2xl">
              Прайс-лист на выездную химчистку мягкой мебели, диванов, матрасов,
              ковров, ковролина, салона автомобиля и&nbsp;ростовых кукол
              в&nbsp;Москве и&nbsp;Московской области. Выезд мастера
              &mdash; бесплатно. Оплата по&nbsp;факту.
            </p>
            <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Цены от&nbsp;1000&nbsp;₽
            </p>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {PRICE_CATEGORIES.map((category) => (
                <div
                  key={category.title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl mb-4">
                    {category.title}
                  </h2>
                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li
                        key={item.name}
                        className="flex justify-between gap-4 text-sm sm:text-base border-b border-gray-100 pb-2"
                      >
                        <span className="text-text-secondary">
                          {item.name}
                          {item.note && (
                            <span className="block text-xs text-text-secondary/70 mt-0.5">
                              {item.note}
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-text-primary whitespace-nowrap">
                          {item.price}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-bg-alt p-6">
              <ul className="space-y-2 text-sm text-text-secondary">
                {PRICE_NOTES.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 rounded-2xl bg-primary p-8 text-center text-white max-md:p-6">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl max-md:text-xl">
                Не нашли свою вещь в&nbsp;прайсе?
              </h2>
              <p className="mt-2 text-white/70">
                Позвоните — рассчитаем стоимость по&nbsp;телефону за&nbsp;2&nbsp;минуты
              </p>
              <div className="mt-6 flex justify-center gap-4 max-md:flex-col max-md:items-center">
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
        </Section>
      </main>
      <Footer />
    </>
  );
}
