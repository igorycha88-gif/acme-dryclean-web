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
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { CONTACTS, SERVICES } from "@/lib/constants";
import {
  getDistrictBySlug,
  getAllDistrictSlugs,
  getOtherDistricts,
} from "@/lib/districtData";
import {
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllDistrictSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);
  if (!district) return { title: "Район не найден", robots: { index: false } };

  const canonicalUrl = `${SITE_URL}/raiony/${slug}`;
  const title = `Химчистка на дому ${district.namePrepositional} — выезд мастера за 1 час | da-dryclean`;
  const description = `Профессиональная химчистка на дому ${district.namePrepositional} (${district.okrug}): диваны, матрасы, ковры, ковролин, салон авто. Выезд мастера в течение 1 часа, безопасная химия, гарантия результата. Без предоплаты. Звоните: +7 (495) 226-15-73.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "D&A Dry Cleaning",
    },
    keywords: [
      `химчистка на дому ${district.namePrepositional}`,
      `химчистка дивана ${district.namePrepositional}`,
      `химчистка матраса ${district.namePrepositional}`,
      `химчистка ковра ${district.namePrepositional}`,
      `выездная химчистка ${district.name}`,
      `химчистка ${district.name} москва`,
    ],
    robots: {
      index: true,
      follow: true,
    },
  };
}

const STEPS = [
  {
    number: "01",
    title: "Заявка",
    description:
      "Позвоните или оставьте заявку — менеджер перезвонит в течение 15 минут и согласует удобное время.",
  },
  {
    number: "02",
    title: "Выезд и чистка",
    description:
      "Мастер приедет в течение 1 часа, оценит состояние вещей и выполнит химчистку на месте.",
  },
  {
    number: "03",
    title: "Приёмка и оплата",
    description:
      "Вы принимаете результат и только потом оплачиваете работу. Без предоплат.",
  },
];

const BENEFITS = [
  {
    icon: Clock,
    title: "Выезд за 1 час",
    description:
      "Срочный выезд мастера по району — в течение 1 часа после заявки.",
  },
  {
    icon: ShieldCheck,
    title: "Безопасная химия",
    description:
      "Гипоаллергенные средства, безопасные для детей и домашних животных.",
  },
  {
    icon: Sparkles,
    title: "Гарантия результата",
    description:
      "Если результат не устроит — бесплатно переделаем или вернём деньги.",
  },
  {
    icon: Truck,
    title: "Бесплатный выезд",
    description:
      "Выезд мастера в пределах МКАД — бесплатно. Оплата только по факту работ.",
  },
  {
    icon: CheckCircle,
    title: "Опытные мастера",
    description:
      "Профессиональное оборудование Karcher и мастера с многолетним опытом.",
  },
];

export default async function DistrictPage({ params }: Props) {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);
  if (!district) notFound();

  const otherDistricts = getOtherDistricts(slug);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Районы", url: "/raiony" },
    { name: district.name, url: `/raiony/${slug}` },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();

  return (
    <>
      <Script
        id={`structured-data-breadcrumb-district-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id={`structured-data-local-business-district-${slug}`}
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
              <Link
                href="/raiony"
                className="hover:text-white/80 transition-colors"
              >
                Районы
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-white/70">{district.name}</span>
            </nav>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
              Химчистка на&nbsp;дому {district.namePrepositional}
            </h1>
            <p className="mt-4 text-base text-white/80 sm:text-lg max-w-2xl">
              Профессиональная выездная химчистка диванов, матрасов, ковров
              и&nbsp;мягкой мебели {district.namePrepositional} ({district.okrug}
              ). Выезд мастера в&nbsp;течение 1&nbsp;часа. Безопасная химия,
              гарантия результата. Стоимость рассчитает менеджер — прайс-лист
              доступен для&nbsp;скачивания.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                variant="secondary"
                href="#cta-district"
                className="!border-white !text-white hover:!bg-white hover:!text-primary"
              >
                Заказать
                <ArrowRight size={16} />
              </Button>
              <Button
                variant="secondary"
                href={`tel:${CONTACTS.phoneRaw}`}
                className="!border-white !text-white hover:!bg-white hover:!text-primary"
              >
                <Phone size={16} />
                {CONTACTS.phone}
              </Button>
            </div>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-[26px] leading-8 sm:text-3xl sm:leading-[40px]">
                О&nbsp;районе {district.name}
              </h2>
              <div className="mt-6 text-text-secondary leading-relaxed">
                <p>
                  {district.name} — район {district.okrug} города Москвы.
                  {district.metro.length > 0 && (
                    <>
                      {" "}
                      Ближайшие станции метро и&nbsp;МЦД:{" "}
                      {district.metro.join(", ")}.
                    </>
                  )}{" "}
                  Мы выполняем химчистку на&nbsp;дому {district.namePrepositional}{" "}
                  и&nbsp;в&nbsp;соседних районах: мастер приезжает
                  с&nbsp;профессиональным оборудованием Karcher, всё необходимое
                  — с&nbsp;собой.
                </p>
                <p className="mt-4">
                  Работаем ежедневно с&nbsp;09:00 до&nbsp;21:00. Срочный выезд
                  {district.namePrepositional} — в&nbsp;течение 1–2 часов.
                  Точную стоимость мастер озвучит после осмотра, оплата — только
                  по&nbsp;факту выполненных работ. Актуальный прайс-лист можно
                  скачать в&nbsp;подвале сайта.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Услуги {district.namePrepositional}
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((service) => (
                <Link
                  key={service.id}
                  href={`/uslugi/${service.slug}`}
                  className="group rounded-xl border border-gray-100 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <Image
                      src={service.image}
                      alt={`${service.title} ${district.namePrepositional} — химчистка на дому`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                      Подробнее <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Как мы работаем
            </h2>
            <div className="mt-12 grid grid-cols-3 gap-8 max-md:grid-cols-1 max-md:gap-10">
              {STEPS.map((step, idx) => (
                <div key={step.number} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <CheckCircle size={28} />
                  </div>
                  <span className="mt-4 inline-block font-[family-name:var(--font-heading)] font-bold text-5xl text-primary/10">
                    {step.number}
                  </span>
                  <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {step.description}
                  </p>
                  {idx < STEPS.length - 1 && (
                    <div
                      className="absolute top-8 -right-4 hidden md:block text-text-secondary/30"
                      aria-hidden="true"
                    >
                      &rarr;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Почему выбирают нас
            </h2>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-gray-100 bg-white p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <benefit.icon size={24} />
                  </div>
                  <h3 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        <section id="cta-district" className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] max-md:text-[26px] max-md:leading-8">
                Закажите химчистку {district.namePrepositional}
              </h2>
              <p className="mt-3 text-white/70">
                Оставьте заявку — перезвоним в течение 15 минут и согласуем
                удобное время. Менеджер рассчитает стоимость, без предоплаты.
              </p>
              <div className="mt-8 flex justify-center gap-4 max-md:flex-col max-md:items-center">
                <Button
                  variant="primary"
                  href={`tel:${CONTACTS.phoneRaw}`}
                >
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

        {otherDistricts.length > 0 && (
          <Section>
            <Container>
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
                Химчистка в соседних районах
              </h2>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherDistricts.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/raiony/${d.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <MapPin
                      size={18}
                      className="shrink-0 text-secondary group-hover:text-accent transition-colors"
                    />
                    <span className="font-medium">{d.name}</span>
                    <ArrowRight
                      size={14}
                      className="ml-auto shrink-0 text-text-secondary/40 group-hover:text-secondary transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </Container>
          </Section>
        )}
      </main>
      <Footer />
    </>
  );
}
