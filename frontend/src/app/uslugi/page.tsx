import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Все услуги — D&A Dry Cleaning",
  description:
    "Профессиональная выездная химчистка в Москве и МО. Диваны, ковры, матрасы, автомобили, шторы, ковролин. Выезд бесплатно.",
};

export default function AllServicesPage() {
  return (
    <>
      <TopBar />
      <Navigation />
      <main>
        <Section>
          <Container>
            <h1 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
              Наши услуги
            </h1>
            <p className="mt-3 text-center text-text-secondary max-w-2xl mx-auto">
              Профессиональная выездная химчистка в Москве и Московской области.
              Выезд мастера — бесплатно. Оплата по факту.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6 max-md:grid-cols-2 max-[480px]:grid-cols-1">
              {SERVICES.map((service) => (
                <Link
                  key={service.id}
                  href={`/uslugi/${service.slug}`}
                  className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-400 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="aspect-[4/3] rounded-lg bg-bg-alt overflow-hidden relative">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <h2 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-xl max-md:text-lg">
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
                <Button
                  variant="primary"
                  href={`tel:${CONTACTS.phoneRaw}`}
                >
                  {CONTACTS.phone}
                </Button>
                <Button variant="secondary" href="/#cta-form" className="!border-white !text-white hover:!bg-white hover:!text-primary">
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
