import { ShieldCheck, Shield, CreditCard, Clock } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";

const advantages = [
  {
    icon: ShieldCheck,
    title: "Гарантия качества",
    description:
      "Профессионалы с обучением. Гарантия результата на все виды работ.",
  },
  {
    icon: Shield,
    title: "Безопасность",
    description:
      "Профессиональные средства, гипоаллергенная химия. Безопасно для детей и животных.",
  },
  {
    icon: CreditCard,
    title: "Без предоплаты",
    description:
      "Оплата только по факту выполнения и приёмки выполненных работ.",
  },
  {
    icon: Clock,
    title: "Работаем ежедневно",
    description:
      "С 9:00 до 21:00 без выходных. Срочный выезд в течение 1-2 часов!",
  },
];

export default function WhyUs() {
  return (
    <Section id="about">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Почему выбирают нас
        </h2>

        <div className="mt-12 grid grid-cols-4 gap-6 max-md:grid-cols-2 max-[480px]:grid-cols-1">
          {advantages.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-4 sm:p-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <item.icon size={24} />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
