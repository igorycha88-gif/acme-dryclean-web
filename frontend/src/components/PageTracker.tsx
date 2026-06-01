"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/tracker";

export default function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracked = useRef<string>("");

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    if (tracked.current === url) return;
    tracked.current = url;

    trackPageView(
      typeof window !== "undefined" ? window.location.href : url,
      typeof document !== "undefined" ? document.referrer : undefined
    );
  }, [pathname, searchParams]);

  return null;
}
