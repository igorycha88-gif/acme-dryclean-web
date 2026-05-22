import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Phone,
  ShieldCheck,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { CONTACTS } from "@/lib/constants";
import {
  getServiceBySlug,
  getAllServiceSlugs,
  getOtherServices,
} from "@/lib/serviceData";
import { getRelatedArticles } from "@/lib/blogData";
import {
  generateServiceJsonLd,
  generateFAQPageJsonLd,
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Услуга не найдена", robots: { index: false } };

  const canonicalUrl = `${SITE_URL}/uslugi/${slug}`;

  return {
    title: service.seoTitle,
    description: service.seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: service.seoTitle,
      description: service.seoDescription,
      url: canonicalUrl,
      type: "website",
      siteName: "D&A Dry Cleaning",
    },
    twitter: {
      card: "summary_large_image",
      title: service.seoTitle,
      description: service.seoDescription,
    },
    keywords: [
      service.title.toLowerCase(),
      `${service.title.toLowerCase()} на дому москва`,
      `${service.title.toLowerCase()} цена москва`,
      `профессиональная ${service.title.toLowerCase()} москва`,
      `${service.title.toLowerCase()} с выездом москва`,
      "химчистка москва",
      "выездная химчистка москва",
    ],
    robots: {
      index: true,
      follow: true,
    },
  };
}

function BenefitIcon({ index }: { index: number }) {
  const icons = [ShieldCheck, Clock, CheckCircle, CheckCircle, CheckCircle, CheckCircle];
  const Icon = icons[index % icons.length];
  return <Icon size={24} />;
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const otherServices = getOtherServices(slug);
  const relatedArticles = getRelatedArticles(slug);

  const serviceJsonLd = generateServiceJsonLd(slug);
  const faqJsonLd = generateFAQPageJsonLd(service.faq);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Услуги", url: "/uslugi" },
    { name: service.title, url: `/uslugi/${slug}` },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();

  return (
    <>
      {serviceJsonLd && (
        <Script
          id={`structured-data-service-${slug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      )}
      <Script
        id={`structured-data-faq-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Script
        id={`structured-data-breadcrumb-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Script
        id={`structured-data-local-business-${slug}`}
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
              <Link
                href="/uslugi"
                className="hover:text-white/80 transition-colors"
              >
                Услуги
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-white/70">{service.title}</span>
            </nav>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
                  {service.title}
                </h1>
                <p className="mt-4 text-base text-white/80 sm:text-lg">
                  {service.shortDescription}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button
                    variant="secondary"
                    href="#cta-service"
                    className="!border-white !text-white hover:!bg-white hover:!text-primary"
                  >
                    Заказать
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden relative">
                <Image
                  src={service.heroImage}
                  alt={`${service.title} — профессиональная химчистка на дому в Москве и МО`}
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
                О&nbsp;услуге &laquo;{service.title}&raquo;
              </h2>
              <div className="mt-6 text-text-secondary leading-relaxed whitespace-pre-line">
                {service.fullDescription}
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Почему выбирают нас
            </h2>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-white p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <BenefitIcon index={i} />
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

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Как мы работаем
            </h2>
            <div className="mt-12 grid grid-cols-3 gap-8 max-md:grid-cols-1 max-md:gap-10">
              {service.steps.map((step, idx) => (
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
                  {idx < service.steps.length - 1 && (
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
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen size={20} className="text-secondary" />
              <p className="text-sm font-medium uppercase tracking-wide text-secondary">
                Полезные статьи
              </p>
            </div>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Читайте также о {service.title.toLowerCase()}
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.length > 0 ? (
                relatedArticles.slice(0, 3).map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="text-xs text-text-secondary mb-2">
                      <time dateTime={article.publishedAt}>
                        {new Date(article.publishedAt).toLocaleDateString(
                          "ru-RU",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </time>
                    </div>
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg leading-snug group-hover:text-secondary transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                      Читать
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                ))
              ) : (
                service.articles.map((article) => (
                  <article
                    key={article.slug}
                    className="rounded-xl border border-gray-100 bg-white p-6"
                  >
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg leading-snug">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      {article.excerpt}
                    </p>
                  </article>
                ))
              )}
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Частые вопросы о {service.title.toLowerCase()}
            </h2>
            <div className="mt-10 max-w-3xl mx-auto space-y-4">
              {service.faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-100 bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-[family-name:var(--font-heading)] font-semibold text-lg max-md:text-base [&::-webkit-details-marker]:hidden list-none">
                    {item.question}
                    <ChevronDown
                      size={20}
                      className="shrink-0 text-text-secondary transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </Container>
        </Section>

        <section id="cta-service" className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] max-md:text-[26px] max-md:leading-8">
                Закажите {service.title.toLowerCase()} в Москве
              </h2>
              <p className="mt-3 text-white/70">
                Оставьте заявку — перезвоним в течение 15 минут и согласуем
                удобное время. Без предоплаты.
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

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Другие услуги химчистки
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherServices.slice(0, 5).map((s) => (
                <Link
                  key={s.slug}
                  href={`/uslugi/${s.slug}`}
                  className="group rounded-xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                    {s.shortDescription}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                    Подробнее <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button variant="secondary" href="/uslugi">
                Все услуги
                <ArrowRight size={16} />
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
