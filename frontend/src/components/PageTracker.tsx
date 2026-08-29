"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView, trackPhoneClick } from "@/lib/tracker";

const PHONE_CLICK_DEBOUNCE_MS = 5000;

function PageTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracked = useRef<string>("");
  const globalSetup = useRef(false);
  const lastPhoneClickAt = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    if (tracked.current === url) return;
    tracked.current = url;

    trackPageView(
      typeof window !== "undefined" ? window.location.href : url,
      typeof document !== "undefined" ? document.referrer : undefined
    );
  }, [pathname, searchParams]);

  useEffect(() => {
    if (globalSetup.current) return;
    globalSetup.current = true;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a[href^='tel:']");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      // ADR-012: at most one click_phone event per tel: link per 5 seconds.
      const now = Date.now();
      const last = lastPhoneClickAt.current.get(href) ?? 0;
      if (now - last < PHONE_CLICK_DEBOUNCE_MS) return;
      lastPhoneClickAt.current.set(href, now);

      trackPhoneClick(href.replace("tel:", ""));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}

export default function PageTracker() {
  return (
    <Suspense fallback={null}>
      <PageTrackerInner />
    </Suspense>
  );
}
