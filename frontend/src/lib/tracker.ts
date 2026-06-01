const TRACKING_API =
  process.env.NEXT_PUBLIC_TRACKING_API_URL || "";

const VISITOR_KEY = "da_tracker_visitor_id";
const SESSION_KEY = "da_tracker_session_id";
const SESSION_TIMEOUT = 30 * 60 * 1000;

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  const lastActivity = parseInt(
    localStorage.getItem("da_tracker_last_activity") || "0",
    10
  );

  if (!id || Date.now() - lastActivity > SESSION_TIMEOUT) {
    id = generateId();
    localStorage.setItem(SESSION_KEY, id);
  }
  localStorage.setItem("da_tracker_last_activity", String(Date.now()));
  return id;
}

export interface TrackEventPayload {
  session_id: string;
  visitor_id: string;
  event_type:
    | "page_view"
    | "service_click"
    | "phone_click"
    | "messenger_click"
    | "form_submit";
  event_name?: string;
  payload: Record<string, unknown>;
  page_url?: string;
  referrer?: string;
}

function sendEvent(data: TrackEventPayload): void {
  try {
    const body = JSON.stringify(data);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${TRACKING_API}/api/v1/tracking/event`, body);
    } else {
      fetch(`${TRACKING_API}/api/v1/tracking/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* silently fail */
  }
}

export function trackPageView(url?: string, referrer?: string): void {
  sendEvent({
    session_id: getSessionId() as unknown as string,
    visitor_id: getVisitorId(),
    event_type: "page_view",
    page_url: url || (typeof window !== "undefined" ? window.location.href : ""),
    referrer:
      referrer ||
      (typeof document !== "undefined" ? document.referrer : undefined),
    payload: {},
  });
}

export function trackServiceClick(
  serviceSlug: string,
  serviceName: string
): void {
  sendEvent({
    session_id: getSessionId() as unknown as string,
    visitor_id: getVisitorId(),
    event_type: "service_click",
    event_name: serviceName,
    payload: { service_slug: serviceSlug, service_name: serviceName },
  });
}

export function trackPhoneClick(phone: string): void {
  sendEvent({
    session_id: getSessionId() as unknown as string,
    visitor_id: getVisitorId(),
    event_type: "phone_click",
    event_name: "phone_click",
    payload: { phone },
  });
}

export function trackMessengerClick(messenger: "telegram" | "max"): void {
  sendEvent({
    session_id: getSessionId() as unknown as string,
    visitor_id: getVisitorId(),
    event_type: "messenger_click",
    event_name: messenger === "telegram" ? "Telegram" : "МАКС",
    payload: { messenger },
  });
}

export function trackFormSubmit(
  location: "hero" | "cta",
  serviceType: string | undefined,
  success: boolean
): void {
  sendEvent({
    session_id: getSessionId() as unknown as string,
    visitor_id: getVisitorId(),
    event_type: "form_submit",
    event_name: success ? "form_success" : "form_error",
    payload: { form_location: location, service_type: serviceType, success },
  });
}
