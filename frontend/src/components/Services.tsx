import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { SERVICES } from "@/lib/constants";

export default function Services() {
  return (
    <Section id="services">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Наши услуги
        </h2>

        <div className="mt-12 grid grid-cols-3 gap-6 max-md:grid-cols-2 max-[480px]:grid-cols-1">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-400 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[4/3] rounded-lg bg-bg-alt flex items-center justify-center text-text-secondary text-sm">
                Фото: {service.title}
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-xl max-md:text-lg">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {service.description}
              </p>
              <a
                href={`/uslugi/${service.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm text-secondary hover:text-accent transition-colors duration-300"
              >
                Подробнее
                <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="secondary" href="/uslugi">
            Все 12 услуг
            <ArrowRight size={16} />
          </Button>
        </div>
      </Container>
    </Section>
  );
}
