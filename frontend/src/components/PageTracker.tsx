"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView, trackPhoneClick } from "@/lib/tracker";

function PageTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracked = useRef<string>("");
  const globalSetup = useRef(false);

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
      if (target) {
        const href = target.getAttribute("href") || "";
        const phone = href.replace("tel:", "");
        trackPhoneClick(phone);
      }
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
