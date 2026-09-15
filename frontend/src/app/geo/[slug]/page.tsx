import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Truck,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { CONTACTS } from "@/lib/constants";
import {
  getGeoCityBySlug,
  getAllGeoSlugs,
  getOtherGeoCities,
} from "@/lib/geoData";
import {
  generateFAQPageJsonLd,
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllGeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = getGeoCityBySlug(slug);
  if (!city) return { title: "Город не найден", robots: { index: false } };

  const canonicalUrl = `${SITE_URL}/geo/${slug}`;

  return {
    title: city.metaTitle,
    description: city.metaDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: city.metaTitle,
      description: city.metaDescription,
      url: canonicalUrl,
      type: "website",
      siteName: "D&A Dry Cleaning",
    },
    keywords: city.keywords,
    robots: { index: true, follow: true },
  };
}

export default async function GeoCityPage({ params }: Props) {
  const { slug } = await params;
  const city = getGeoCityBySlug(slug);
  if (!city) notFound();

  const otherCities = getOtherGeoCities(slug);

  const faq = [
    {
      question: `Сколько стоит химчистка ковра с вывозом ${city.namePrepositional}?`,
      answer: `Чистка — от 350 ₽/м² за синтетику и от 500 ₽/м² за шерсть. Забор и доставка ${city.namePrepositional} рассчитываются менеджером и зависят от размера ковра и точного адреса. Полную стоимость назовём до выезда.`,
    },
    {
      question: `Как быстро приедете за ковром ${city.namePrepositional}?`,
      answer: `${city.transport}. Обычно забираем ковры в течение 1–2 дней после заявки — менеджер согласует с вами удобный интервал.`,
    },
    {
      question: `Ковёр почистят у меня дома или увезут?`,
      answer: `Возможны оба варианта: мастер может почистить ковёр на месте (сушка 3–6 часов), либо курьер заберёт ковёр в цех и вернёт чистым через 1–3 дня. Для ${city.namePrepositional} чаще выбирают вывоз — это удобнее.`,
    },
    {
      question: "Какие ковры вы чистите?",
      answer: "Все типы: синтетика, шерсть, длинный ворс, вискоза, хлопок, шёлк. Деликатные материалы чистим щадящим сухим методом. Убираем пятна, запахи, пылевых клещей.",
    },
    {
      question: `Работаете ли вы в других городах рядом с ${city.name}?`,
      answer: `Да, мы выезжаем за коврами по всей Москве и Московской области. Посмотрите список городов или позвоните: ${CONTACTS.phone}.`,
    },
  ];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: city.metaTitle,
    description: city.metaDescription,
    url: `${SITE_URL}/geo/${slug}`,
    provider: {
      "@type": "LocalBusiness",
      name: "D&A Dry Cleaning",
      url: SITE_URL,
      telephone: [CONTACTS.phone, CONTACTS.phoneAlt],
    },
    serviceType: "Химчистка ковров с вывозом и доставкой",
    areaServed: {
      "@type": "City",
      name: city.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      lowPrice: 350,
      availability: "https://schema.org/InStock",
    },
  };

  const faqJsonLd = generateFAQPageJsonLd(faq);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Города обслуживания", url: "/geo" },
    { name: city.name, url: `/geo/${slug}` },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();

  return (
    <>
      <Script
        id={`structured-data-service-geo-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <Script
        id={`structured-data-faq-geo-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Script
        id={`structured-data-breadcrumb-geo-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Script
        id={`structured-data-local-business-geo-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
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
              <Link href="/geo" className="hover:text-white/80 transition-colors">
                Города обслуживания
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-white/70">{city.name}</span>
            </nav>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
                  {city.h1}
                </h1>
                <p className="mt-4 text-base text-white/80 sm:text-lg">
                  {city.intro}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button
                    variant="secondary"
                    href="#cta-geo"
                    className="!border-white !text-white hover:!bg-white hover:!text-primary"
                  >
                    Заказать вывоз ковра
                    <ArrowRight size={16} />
                  </Button>
                  <a
                    href={`tel:${CONTACTS.phoneRaw}`}
                    className="inline-flex items-center gap-2 font-[family-name:var(--font-heading)] font-bold text-lg text-white hover:text-white/80 transition-colors"
                    aria-label={`Позвонить: ${CONTACTS.phone}`}
                  >
                    <Phone size={18} className="text-secondary" />
                    {CONTACTS.phone}
                  </a>
                </div>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden relative">
                <Image
                  src="/images/services/carpet.jpg"
                  alt={`${city.h1} — чистка ковров с забором и доставкой`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-[26px] leading-8 sm:text-3xl sm:leading-[40px]">
                Химчистка ковров {city.namePrepositional}: как мы работаем
              </h2>
              <div className="mt-6 text-text-secondary leading-relaxed">
                <p>
                  {city.name} — {city.region}, {city.distanceFromMkad}.{" "}
                  {city.transport}. Мы приходим за ковром по указанному вами
                  адресу, поэтому добираться до нас самостоятельно не нужно.
                </p>
                {city.uniqueText.map((paragraph, i) => (
                  <p key={i} className="mt-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Цены на чистку ковров
            </h2>
            <div className="mt-10 max-w-3xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-xl overflow-hidden text-sm">
                <thead>
                  <tr className="bg-primary text-white text-left">
                    <th scope="col" className="px-4 py-3 font-[family-name:var(--font-heading)] font-semibold">
                      Материал ковра
                    </th>
                    <th scope="col" className="px-4 py-3 font-[family-name:var(--font-heading)] font-semibold">
                      Цена
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Синтетика", "350 ₽/м²"],
                    ["Шерстяной ковёр", "500 ₽/м²"],
                    ["Шерсть, длинный ворс", "600 ₽/м²"],
                    ["Вискоза", "1 250 ₽/м²"],
                    ["Хлопок", "2 500 ₽/м²"],
                    ["Шёлк", "2 500 ₽/м²"],
                    ["Выведение запахов", "от 1 000 ₽"],
                    ["Сильные загрязнения", "+30%"],
                  ].map(([name, price], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 border-t border-gray-100 text-text-secondary">
                        {name}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-100 font-[family-name:var(--font-heading)] font-semibold whitespace-nowrap">
                        {price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-text-secondary/70">
                Стоимость забора и доставки {city.namePrepositional} рассчитает
                менеджер — зависит от размера ковра и адреса.
              </p>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Как происходит вывоз ковра
            </h2>
            <div className="mt-12 grid grid-cols-3 gap-8 max-md:grid-cols-1 max-md:gap-10">
              {[
                {
                  title: "Заявка",
                  description:
                    "Позвоните или оставьте заявку — согласуем размер ковра, адрес и удобный интервал",
                },
                {
                  title: "Забор",
                  description: `Курьер приезжает ${city.namePrepositional}, сам сворачивает, упаковывает и выносит ковёр`,
                },
                {
                  title: "Чистка и доставка",
                  description:
                    "Чистим и сушим ковёр в цеху 1–3 дня, затем привозим обратно и заносим в квартиру",
                },
              ].map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    {i === 0 ? <CheckCircle size={28} /> : i === 1 ? <Truck size={28} /> : <Clock size={28} />}
                  </div>
                  <span className="mt-4 inline-block font-[family-name:var(--font-heading)] font-bold text-5xl text-primary/10">
                    {i + 1}
                  </span>
                  <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-text-secondary">
              Подробнее об услуге, сроках и сравнении служб —{" "}
              <Link
                href="/uslugi/himchistka-kovrov-s-vyvozom-i-dostavkoy"
                className="text-secondary hover:text-accent transition-colors"
              >
                химчистка ковров с вывозом и доставкой
              </Link>
              .
            </p>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Частые вопросы
            </h2>
            <div className="mt-10 max-w-3xl mx-auto space-y-4">
              {faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-100 bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-[family-name:var(--font-heading)] font-semibold text-lg max-md:text-base [&::-webkit-details-marker]:hidden list-none">
                    {item.question}
                    <svg
                      className="shrink-0 text-text-secondary transition-transform duration-300 group-open:rotate-180"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </Container>
        </Section>

        <section id="cta-geo" className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] max-md:text-[26px] max-md:leading-8">
                Закажите вывоз ковра {city.namePrepositional}
              </h2>
              <p className="mt-3 text-white/70">
                Перезвоним в течение 15 минут, рассчитаем стоимость и
                согласуем удобное время забора. Без предоплаты.
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

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Другие города обслуживания
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/geo/${c.slug}`}
                  className="group rounded-xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2 text-secondary">
                    <MapPin size={16} />
                    <span className="text-xs uppercase tracking-wide font-medium">
                      {c.region}
                    </span>
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--font-heading)] font-bold text-lg group-hover:text-secondary transition-colors">
                    {c.name}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                    Подробнее <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
