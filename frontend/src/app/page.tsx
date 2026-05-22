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
  generateReviewsJsonLd,
  generateFAQPageJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/structuredData";
import { FAQ_ITEMS } from "@/lib/constants";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title:
    "Химчистка мебели на дому в Москве — D&A Dry Cleaning | Выезд бесплатно",
  description:
    "Закажите выездную химчистку диванов, ковров, матрасов, ростовых кукол и салона авто в Москве и МО. Без предоплаты. Гарантия результата. Более 5000 выполненных заказов. Ежедневно 09:00–21:00.",
  alternates: {
    canonical: SITE_URL,
  },
};

export default function Home() {
  const localBusinessJsonLd = generateLocalBusinessJsonLd();
  const reviewsJsonLd = generateReviewsJsonLd();
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
        id="structured-data-reviews"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewsJsonLd),
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
        <HowWeWork />
        <BeforeAfter />
        <WhyUs />
        <Promo />
        <B2BSection />
        <Reviews />
        <CTAForm />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
