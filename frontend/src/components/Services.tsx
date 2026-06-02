"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { SERVICES } from "@/lib/constants";
import { trackServiceClick } from "@/lib/tracker";

export default function Services() {
  const router = useRouter();

  return (
    <Section id="services">
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
          Услуги выездной химчистки в Москве
        </h2>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <Link
              key={service.id}
              href={`/uslugi/${service.slug}`}
              onClick={(e) => {
                e.preventDefault();
                trackServiceClick(service.slug, service.title);
                setTimeout(() => router.push(`/uslugi/${service.slug}`), 300);
              }}
              className="group rounded-xl border border-gray-100 bg-white p-5 sm:p-6 transition-all duration-400 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-square rounded-lg overflow-hidden relative">
                <Image
                  src={service.image}
                  alt={`${service.title} на дому — профессиональная химчистка в Москве`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-lg sm:text-xl">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {service.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors duration-300">
                Подробнее
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="secondary" href="/uslugi">
            Все услуги
            <ArrowRight size={16} />
          </Button>
        </div>
      </Container>
    </Section>
  );
}
