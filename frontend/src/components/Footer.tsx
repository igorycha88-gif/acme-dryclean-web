import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import Container from "@/components/ui/Container";
import { CONTACTS } from "@/lib/constants";

const serviceLinks = [
  { label: "Химчистка диванов", href: "/uslugi/himchistka-divanov" },
  { label: "Химчистка салона авто", href: "/uslugi/himchistka-salona-avtomobilya" },
  { label: "Химчистка ростовых кукол", href: "/uslugi/himchistka-rostovyh-kukol" },
  { label: "Химчистка ковров", href: "/uslugi/himchistka-kovrov" },
  { label: "Химчистка матрасов", href: "/uslugi/himchistka-matrasov" },
  { label: "Химчистка ковролина", href: "/uslugi/himchistka-kovrolina" },
  { label: "Все услуги", href: "/uslugi" },
];

const companyLinks = [
  { label: "О компании", href: "/o-kompanii" },
  { label: "Блог", href: "/blog" },
  { label: "Прайс-лист", href: "/prajs" },
  { label: "Фото работ", href: "/foto" },
  { label: "Калькулятор", href: "/kalkulyator" },
  { label: "Отзывы", href: "/otzyvy" },
  { label: "Контакты", href: "/kontakty" },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <Container className="py-12">
        <div className="grid grid-cols-4 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-heading)] font-bold text-2xl"
            >
              D&A
            </Link>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Профессиональная выездная химчистка мягкой мебели, ковров, матрасов
              и салона автомобиля в Москве и Московской области с 2018 года.
            </p>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-heading)] font-bold text-sm uppercase tracking-wide mb-4">
              Услуги
            </h4>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-heading)] font-bold text-sm uppercase tracking-wide mb-4">
              Компания
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-heading)] font-bold text-sm uppercase tracking-wide mb-4">
              Контакты
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`tel:${CONTACTS.phoneRaw}`}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone size={14} />
                  {CONTACTS.phone}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACTS.phoneAltRaw}`}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone size={14} />
                  {CONTACTS.phoneAlt}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACTS.email}`}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Mail size={14} />
                  {CONTACTS.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                {CONTACTS.address}
              </li>
              <li className="flex gap-3 pt-2">
                <a
                  href={`https://wa.me/${CONTACTS.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Написать в WhatsApp"
                >
                  <MessageCircle size={18} />
                </a>
                <a
                  href={`https://t.me/${CONTACTS.telegram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Написать в Telegram"
                >
                  <MessageCircle size={18} />
                </a>
                <a
                  href={CONTACTS.yandexMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="D&A Dry Cleaning на Яндекс Картах"
                >
                  <MapPin size={18} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          &copy; 2018&ndash;2026, Dry Cleaning D&A. Все права защищены.
        </div>
      </Container>
    </footer>
  );
}
