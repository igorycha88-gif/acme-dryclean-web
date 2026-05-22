"use client";

import { Mail, Clock, Star, Phone, MessageCircle } from "lucide-react";
import Container from "@/components/ui/Container";
import { CONTACTS } from "@/lib/constants";

export default function TopBar() {
  return (
    <div className="bg-primary text-white text-xs">
      <Container className="flex h-10 items-center justify-between">
        <div className="flex items-center gap-4 max-md:hidden">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {CONTACTS.schedule}
          </span>
          <a
            href={`mailto:${CONTACTS.email}`}
            className="flex items-center gap-1 hover:text-secondary transition-colors"
          >
            <Mail size={12} />
            {CONTACTS.email}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Star size={12} className="text-warning fill-warning" />
            Яндекс Карты
          </span>
          <a
            href={`tel:${CONTACTS.phoneRaw}`}
            className="flex items-center gap-1 md:hidden hover:text-secondary transition-colors"
          >
            <Phone size={12} />
            {CONTACTS.phone}
          </a>
          <a
            href={`https://t.me/${CONTACTS.telegram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-secondary transition-colors"
          >
            <MessageCircle size={12} />
            <span className="max-md:hidden">Telegram</span>
          </a>
        </div>
      </Container>
    </div>
  );
}
