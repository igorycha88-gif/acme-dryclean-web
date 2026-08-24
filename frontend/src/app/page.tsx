import type { Metadata } from "next";
import Script from "next/script";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowWeWork from "@/components/HowWeWork";
import BeforeAfter from "@/components/BeforeAfter";
import WhyUs from "@/components/WhyUs";
import Promo from "@/components/Promo";
import B2BSection from "@/components/B2BSection";
import Reviews from "@/components/Reviews";
import CTAForm from "@/components/CTAForm";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import {
  generateLocalBusinessJsonLd,
  generateFAQPageJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/structuredData";
import { FAQ_ITEMS } from "@/lib/constants";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title:
    "Химчистка мебели на дому в Москве — цена от 1000 ₽, выезд за 1 час | da-dryclean",
  description:
    "Профессиональная выездная химчистка мягкой мебели, диванов, матрасов, ковров в Москве и МО. Выезд мастера в течение часа, безопасная химия, гарантия результата. Цена от 1000 ₽. Без предоплаты. Звоните: +7 (495) 226-15-73.",
  alternates: {
    canonical: SITE_URL,
  },
  keywords: [
    "химчистка мебели на дому москва",
    "химчистка дивана на дому москва",
    "химчистка матраса на дому москва",
    "химчистка ковра на дому москва",
    "выездная химчистка москва",
    "химчистка мягкой мебели москва",
    "химчистка на дому москва цена",
  ],
};

export default function Home() {
  const localBusinessJsonLd = generateLocalBusinessJsonLd();
  const faqJsonLd = generateFAQPageJsonLd(FAQ_ITEMS);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
  ]);

  return (
    <>
      <Script
        id="structured-data-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <Script
        id="structured-data-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <TopBar />
      <Navigation />
      <main>
        <Hero />
        <Services />
        <B2BSection />
        <HowWeWork />
        <BeforeAfter />
        <WhyUs />
        <Promo />
        <Reviews />
        <CTAForm />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
