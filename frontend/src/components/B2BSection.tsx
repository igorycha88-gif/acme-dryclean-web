import { ArrowRight, Building2, Utensils, GraduationCap, TreePine } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { B2B_CATEGORIES } from "@/lib/constants";

const icons = [Building2, Utensils, GraduationCap, TreePine];

export default function B2BSection() {
  return (
    <Section id="b2b" className="bg-bg-alt">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Работаем с организациями
        </h2>
        <p className="mt-2 text-center text-text-secondary">
          Комплексные решения для бизнеса с гибкими ценами и удобным графиком
        </p>

        <div className="mt-12 grid grid-cols-4 gap-6 max-md:grid-cols-2 max-[480px]:grid-cols-1">
          {B2B_CATEGORIES.map((cat, idx) => {
            const Icon = icons[idx];
            return (
              <a
                key={cat.slug}
                href={`/${cat.slug}`}
                className="group rounded-xl border border-gray-100 bg-white p-4 sm:p-6 text-center transition-all duration-400 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <Icon size={24} />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg">
                  {cat.title}
                </h3>
              </a>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="primary" href="#cta-form">
            Получить коммерческое предложение
            <ArrowRight size={16} />
          </Button>
        </div>
      </Container>
    </Section>
  );
}
