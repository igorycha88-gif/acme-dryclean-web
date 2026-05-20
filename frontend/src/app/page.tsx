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

export default function Home() {
  return (
    <>
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
