"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { CONTACTS } from "@/lib/constants";

const messengers = [
  {
    id: "telegram",
    label: "Telegram",
    href: CONTACTS.telegramDirect,
    icon: Send,
    color: "bg-[#2AABEE] hover:bg-[#229ED9]",
  },
  {
    id: "max",
    label: "МАКС",
    href: CONTACTS.maxDirect,
    icon: MessageCircle,
    color: "bg-[#6C5CE7] hover:bg-[#5A4BD1]",
  },
] as const;

export default function MessengerButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-[45] flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 animate-[fade-in-up_0.2s_ease-out]">
          {messengers.map((m) => (
            <a
              key={m.id}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-full px-4 py-3 text-white text-sm font-medium shadow-lg transition-transform hover:scale-105 ${m.color}`}
            >
              <m.icon size={18} />
              {m.label}
            </a>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white shadow-xl transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        aria-label="Напишите нам"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
