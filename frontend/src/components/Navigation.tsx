"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { NAV_LINKS, CONTACTS } from "@/lib/constants";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-500 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <Container className="flex h-[70px] items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-heading)] font-bold text-xl text-primary">
          D&A
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-text-primary hover:text-accent transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <a
              href={`tel:${CONTACTS.phoneRaw}`}
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <Phone size={16} />
              {CONTACTS.phone}
            </a>
            <a
              href={`tel:${CONTACTS.phoneAltRaw}`}
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <Phone size={16} />
              {CONTACTS.phoneAlt}
            </a>
          </div>
          <Button href="#cta-form">Оставить заявку</Button>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </Container>

      <div
        className={`lg:hidden fixed inset-0 top-[70px] z-40 bg-white transition-all duration-300 ${
          menuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        }`}
      >
        <div
          className={`flex flex-col items-center gap-6 pt-12 transition-transform duration-300 ${
            menuOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-lg text-text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col items-center gap-2 mt-4">
            <a
              href={`tel:${CONTACTS.phoneRaw}`}
              className="flex items-center gap-2 text-lg font-semibold text-primary"
            >
              <Phone size={20} />
              {CONTACTS.phone}
            </a>
            <a
              href={`tel:${CONTACTS.phoneAltRaw}`}
              className="flex items-center gap-2 text-lg font-semibold text-primary"
            >
              <Phone size={20} />
              {CONTACTS.phoneAlt}
            </a>
          </div>
          <Button href="#cta-form" onClick={() => setMenuOpen(false)}>
            Оставить заявку
          </Button>
        </div>
      </div>
    </nav>
  );
}
