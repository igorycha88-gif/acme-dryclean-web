import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { OKRUGS, getDistrictsByOkrug } from "@/lib/districtData";
import {
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

const OKRUG_NAMES: Record<string, string> = {
  ЦАО: "Центральный административный округ",
  САО: "Северный административный округ",
  СВАО: "Северо-Восточный административный округ",
  ВАО: "Восточный административный округ",
  ЮВАО: "Юго-Восточный административный округ",
  ЮАО: "Южный административный округ",
  ЮЗАО: "Юго-Западный административный округ",
  ЗАО: "Западный административный округ",
  СЗАО: "Северо-Западный административный округ",
  ЗелАО: "Зеленоградский административный округ",
};

export const metadata: Metadata = {
  title:
    "Химчистка по районам Москвы — выезд мастера во все районы | da-dryclean",
  description:
    "Выездная химчистка на дому во всех районах Москвы: диваны, матрасы, ковры, ковролин, мягкая мебель, салон авто, ростовые куклы. Выезд мастера в течение 1 часа. Без предоплаты. Звоните: +7 (495) 226-15-73.",
  alternates: {
    canonical: `${SITE_URL}/raiony`,
  },
  keywords: [
    "химчистка на дому районы москвы",
    "химчистка дивана район",
    "выездная химчистка район москва",
    "химчистка рядом со мной",
    "химчистка на дому мой район",
  ],
  openGraph: {
    title:
      "Химчистка по районам Москвы — выезд мастера во все районы | da-dryclean",
    description:
      "Профессиональная химчистка на дому во всех районах Москвы. Выезд мастера в течение 1 часа. Без предоплаты.",
    url: `${SITE_URL}/raiony`,
    type: "website",
  },
};

export default function DistrictsPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Районы", url: "/raiony" },
  ]);
  const localBusinessJsonLd = generateLocalBusinessJsonLd();

  return (
    <>
      <Script
        id="structured-data-breadcrumb-districts"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="structured-data-local-business-districts"
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
              <span className="text-white/70">Районы</span>
            </nav>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
              Химчистка по&nbsp;районам Москвы
            </h1>
            <p className="mt-4 text-base text-white/80 sm:text-lg max-w-2xl">
              Выездная химчистка на&nbsp;дому во&nbsp;всех районах Москвы
              и&nbsp;Московской области. Мастер приедет в&nbsp;течение 1&nbsp;часа
              с&nbsp;профессиональным оборудованием. Оплата по&nbsp;факту, без
              предоплаты. Стоимость рассчитает менеджер или&nbsp;скачайте
              прайс-лист.
            </p>
          </Container>
        </section>

        <Section>
          <Container>
            {OKRUGS.map((okrug) => (
              <div key={okrug} className="mb-12 last:mb-0">
                <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl">
                  {OKRUG_NAMES[okrug]}
                </h2>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getDistrictsByOkrug(okrug).map((district) => (
                    <Link
                      key={district.slug}
                      href={`/raiony/${district.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <MapPin
                        size={18}
                        className="shrink-0 text-secondary group-hover:text-accent transition-colors"
                      />
                      <span className="font-medium">
                        {district.namePrepositional.charAt(0).toUpperCase() +
                          district.namePrepositional.slice(1)}
                      </span>
                      <ArrowRight
                        size={14}
                        className="ml-auto shrink-0 text-text-secondary/40 group-hover:text-secondary transition-colors"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
