import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Phone, Truck } from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { GEO_CITIES } from "@/lib/geoData";
import { CONTACTS } from "@/lib/constants";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title: "Химчистка ковров с вывозом в городах Московской области — цены",
  description:
    "Химчистка ковров с вывозом и доставкой в городах Подмосковья: Раменское, Химки, Зеленоград, Балашиха, Звенигород, Павловский Посад, Куровское. Синтетика от 350 ₽/м². Тел: +7 (495) 226-15-73.",
  alternates: { canonical: `${SITE_URL}/geo` },
  openGraph: {
    title: "Химчистка ковров с вывозом в городах Московской области — цены",
    description:
      "Забираем ковры с адреса в Подмосковье, чистим и привозим обратно. 7 городов, цены от 350 ₽/м².",
    url: `${SITE_URL}/geo`,
    type: "website",
    siteName: "D&A Dry Cleaning",
  },
  robots: { index: true, follow: true },
};

export default function GeoIndexPage() {
  return (
    <>
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
              <span className="text-white/70">Города обслуживания</span>
            </nav>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
              Химчистка ковров с вывозом в городах Московской области
            </h1>
            <p className="mt-4 text-base text-white/80 sm:text-lg max-w-2xl">
              Забираем ковёр с вашего адреса, чистим профессионально в цеху и
              привозим обратно чистым через 1–3 дня. Или почистим ковёр на дому
              — без вывоза.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                variant="secondary"
                href="#geo-cities"
                className="!border-white !text-white hover:!bg-white hover:!text-primary"
              >
                Выбрать город
                <ArrowRight size={16} />
              </Button>
            </div>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Truck size={20} className="text-secondary" />
              <p className="text-sm font-medium uppercase tracking-wide text-secondary">
                География вывоза
              </p>
            </div>
            <h2
              id="geo-cities"
              className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8"
            >
              Города, куда мы приходим за ковром
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {GEO_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/geo/${city.slug}`}
                  className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2 text-secondary">
                    <MapPin size={18} />
                    <span className="text-xs uppercase tracking-wide font-medium">
                      {city.region}
                    </span>
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-heading)] font-bold text-xl group-hover:text-secondary transition-colors">
                    {city.name}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary line-clamp-3">
                    {city.intro}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                    Химчистка ковров {city.namePrepositional}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="bg-bg-alt">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] max-md:text-[26px] max-md:leading-8">
                Не нашли свой город?
              </h2>
              <p className="mt-4 text-text-secondary">
                Приезжаем за коврами по всей Москве и Московской области.
                Позвоните — скажем точную стоимость вывоза до вашего адреса.
                Или закажите чистку ковра на дому:{" "}
                <Link
                  href="/uslugi/himchistka-kovrov-s-vyvozom-i-dostavkoy"
                  className="text-secondary hover:text-accent transition-colors"
                >
                  как работает вывоз и доставка
                </Link>
                .
              </p>
              <div className="mt-8 flex justify-center gap-4 max-md:flex-col max-md:items-center">
                <Button variant="primary" href={`tel:${CONTACTS.phoneRaw}`}>
                  <Phone size={16} />
                  {CONTACTS.phone}
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
