"use client";

import { Mail, Clock, Phone, Send, MessageCircle } from "lucide-react";
import Container from "@/components/ui/Container";
import { CONTACTS } from "@/lib/constants";
import { trackMessengerClick } from "@/lib/tracker";

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
          <div className="flex items-center gap-3 md:hidden">
          <a
            href={`tel:${CONTACTS.phoneRaw}`}
            className="flex items-center gap-1 hover:text-secondary transition-colors"
          >
            <Phone size={12} />
            {CONTACTS.phone}
          </a>
          <a
            href={`tel:${CONTACTS.phoneAltRaw}`}
            className="flex items-center gap-1 hover:text-secondary transition-colors"
          >
            <Phone size={12} />
            {CONTACTS.phoneAlt}
          </a>
          </div>
          <a
            href={CONTACTS.telegramDirect}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackMessengerClick("telegram")}
            className="flex items-center gap-1 hover:text-secondary transition-colors"
            aria-label="Написать в Telegram"
          >
            <Send size={14} />
            <span className="max-md:hidden">Telegram</span>
          </a>
          <a
            href={CONTACTS.maxDirect}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackMessengerClick("max")}
            className="flex items-center gap-1 hover:text-secondary transition-colors"
            aria-label="Написать в МАКС"
          >
            <MessageCircle size={14} />
            <span className="max-md:hidden">МАКС</span>
          </a>
        </div>
      </Container>
    </div>
  );
}
