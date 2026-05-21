import type { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { SERVICES, CONTACTS } from "@/lib/constants";
import {
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title:
    "Услуги химчистки на дому в Москве — цены от 500₽ | D&A Dry Cleaning",
  description:
    "Полный каталог услуг выездной химчистки в Москве и МО: диваны от 500₽, ковры, матрасы, салон авто, шторы, ковролин. Оборудование Karcher. Без предоплаты. Выезд бесплатно. Звоните!",
  alternates: {
    canonical: `${SITE_URL}/uslugi`,
  },
  openGraph: {
    title: "Услуги химчистки на дому в Москве — цены от 500₽ | D&A Dry Cleaning",
    description:
      "Диваны, ковры, матрасы, салон авто, шторы, ковролин — профессиональная химчистка с выездом. Без предоплаты.",
    url: `${SITE_URL}/uslugi`,
    type: "website",
  },
};

export default function AllServicesPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Услуги", url: "/uslugi" },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();

  return (
    <>
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Script
        id="structured-data-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <TopBar />
      <Navigation />
      <main>
        <Section>
          <Container>
            <h1 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Услуги химчистки на дому в&nbsp;Москве
            </h1>
            <p className="mt-3 text-center text-text-secondary max-w-2xl mx-auto">
              Профессиональная выездная химчистка в&nbsp;Москве и&nbsp;Московской области.
              Выезд мастера&nbsp;&mdash; бесплатно. Оплата по&nbsp;факту. Цены от&nbsp;500&#8381;.
            </p>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((service) => (
                <Link
                  key={service.id}
                  href={`/uslugi/${service.slug}`}
                  className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-400 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="aspect-square rounded-lg overflow-hidden relative">
                    <Image
                      src={service.image}
                      alt={`${service.title} — профессиональная химчистка на дому в Москве`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h2 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg sm:text-xl">
                    {service.title}
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {service.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors duration-300">
                    Подробнее
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-12 rounded-2xl bg-primary p-8 text-center text-white max-md:p-6">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl max-md:text-xl">
                Не нашли нужную услугу?
              </h2>
              <p className="mt-2 text-white/70">
                Позвоните нам — обсудим ваш запрос и подберём решение
              </p>
              <div className="mt-6 flex justify-center gap-4 max-md:flex-col max-md:items-center">
                <Button variant="primary" href={`tel:${CONTACTS.phoneRaw}`}>
                  {CONTACTS.phone}
                </Button>
                <Button
                  variant="secondary"
                  href="/#cta-form"
                  className="!border-white !text-white hover:!bg-white hover:!text-primary"
                >
                  Оставить заявку
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
