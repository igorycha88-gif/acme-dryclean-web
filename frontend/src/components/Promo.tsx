import { Gift, Heart } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";

export default function Promo() {
  return (
    <Section id="promo">
      <Container>
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <div className="rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-6 sm:p-8 text-white">
            <Gift size={28} className="mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm font-medium uppercase tracking-wide opacity-80">
              Приведи друга
            </p>
            <p className="mt-1 font-[family-name:var(--font-heading)] font-extrabold text-2xl sm:text-3xl">
              СКИДКА 20%
            </p>
            <p className="mt-1 text-white/80">
              на следующий заказ
            </p>
            <div className="mt-6">
              <Button
                variant="secondary"
                href="#cta-form"
                className="!border-white !text-white hover:!bg-white hover:!text-accent"
              >
                Подробнее
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-primary p-6 sm:p-8 text-white">
            <Heart size={28} className="mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm font-medium uppercase tracking-wide opacity-80">
              Пенсионерам
            </p>
            <p className="mt-1 font-[family-name:var(--font-heading)] font-extrabold text-2xl sm:text-3xl">
              СКИДКА 10%
            </p>
            <p className="mt-1 text-white/80">
              на все виды услуг
            </p>
            <div className="mt-6">
              <Button
                variant="secondary"
                href="#cta-form"
                className="!border-white !text-white hover:!bg-white hover:!text-primary"
              >
                Подробнее
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
