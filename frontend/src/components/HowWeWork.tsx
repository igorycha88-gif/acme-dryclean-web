import { ClipboardList, Truck, CheckCircle } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";

const steps = [
  {
    number: 1,
    icon: ClipboardList,
    title: "Оставьте заявку",
    description:
      "Позвоните или напишите нам в Telegram, WhatsApp или MAX",
  },
  {
    number: 2,
    icon: Truck,
    title: "Мастер приедет",
    description:
      "Профессиональная чистка за 1–3 часа в удобное для вас время",
  },
  {
    number: 3,
    icon: CheckCircle,
    title: "Примите результат",
    description:
      "Оплата только после приёмки выполненных работ",
  },
];

export default function HowWeWork() {
  return (
    <Section id="how-we-work" className="bg-bg-alt">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Как мы работаем
        </h2>

        <div className="mt-12 grid grid-cols-3 gap-8 max-md:grid-cols-1 max-md:gap-10">
          {steps.map((step, idx) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <step.icon size={28} />
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

              {idx < steps.length - 1 && (
                <div className="absolute top-8 -right-4 hidden md:block text-text-secondary/30">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
