import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Услуга не найдена" };
  return {
    title: service.seoTitle,
    description: service.seoDescription,
  };
}

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
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

  return (
    <>
      <TopBar />
      <Navigation />
      <main>
        <section className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <nav className="text-sm text-white/50 mb-6">
              <Link href="/" className="hover:text-white/80 transition-colors">
                Главная
              </Link>
              <span className="mx-2">/</span>
              <Link href="/uslugi" className="hover:text-white/80 transition-colors">
                Услуги
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white/70">{service.title}</span>
            </nav>
            <div className="max-w-3xl">
              <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-5xl leading-[56px] max-md:text-[32px] max-md:leading-10">
                {service.title}
              </h1>
              <p className="mt-4 text-lg text-white/80 max-md:text-base">
                {service.shortDescription}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="rounded-full bg-accent px-5 py-2 font-[family-name:var(--font-heading)] font-bold text-sm">
                  от {service.priceFrom} руб.
                </span>
                <Button variant="secondary" href="#cta-service" className="!border-white !text-white hover:!bg-white hover:!text-primary">
                  Заказать
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl leading-[40px] max-md:text-2xl max-md:leading-8">
                О&nbsp;услуге
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
            <div className="mt-12 grid grid-cols-3 gap-6 max-md:grid-cols-2 max-[480px]:grid-cols-1">
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
                    <div className="absolute top-8 -right-4 hidden md:block text-text-secondary/30">
                      →
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
              Читайте также
            </h2>
            <div className="mt-10 grid grid-cols-3 gap-6 max-md:grid-cols-1">
              {service.articles.map((article) => (
                <article
                  key={article.slug}
                  className="rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-md"
                >
                  <div className="aspect-[16/9] rounded-lg bg-bg-alt flex items-center justify-center text-text-secondary text-sm">
                    {article.title.slice(0, 40)}...
                  </div>
                  <h3 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg leading-snug">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {article.excerpt}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Частые вопросы
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
                Закажите {service.title.toLowerCase()}
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
              Другие услуги
            </h2>
            <div className="mt-10 grid grid-cols-3 gap-6 max-md:grid-cols-2 max-[480px]:grid-cols-1">
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
