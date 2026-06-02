const TRACKING_API =
  process.env.NEXT_PUBLIC_TRACKING_API_URL || "";

const VISITOR_KEY = "da_tracker_visitor_id";
const SESSION_KEY = "da_tracker_session_id";
const QUEUE_KEY = "da_tracker_queue";
const SESSION_TIMEOUT = 30 * 60 * 1000;
const MAX_QUEUE_SIZE = 50;
const FLUSH_INTERVAL = 5000;

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

interface QueuedEvent {
  data: TrackEventPayload;
  attempts: number;
  queuedAt: number;
}

function getQueue(): QueuedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full — drop oldest
    try {
      const trimmed = queue.slice(-Math.floor(MAX_QUEUE_SIZE / 2));
      localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    } catch {
      // give up
    }
  }
}

function enqueueEvent(data: TrackEventPayload): void {
  const queue = getQueue();
  queue.push({ data, attempts: 0, queuedAt: Date.now() });
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }
  saveQueue(queue);
}

async function flushQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  const queuedAtCutoff = queue[queue.length - 1].queuedAt;
  const events = queue.map((e) => e.data);

  try {
    const url = `${TRACKING_API}/api/v1/tracking/events/batch`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });

    if (res.ok) {
      const currentQueue = getQueue();
      const remaining = currentQueue.filter((e) => e.queuedAt > queuedAtCutoff);
      saveQueue(remaining);
    } else {
      const currentQueue = getQueue();
      const updated = currentQueue.map((e) =>
        e.queuedAt <= queuedAtCutoff ? { ...e, attempts: e.attempts + 1 } : e
      );
      const kept = updated.filter((e) => e.attempts < 5);
      saveQueue(kept);
    }
  } catch {
    const currentQueue = getQueue();
    const updated = currentQueue.map((e) =>
      e.queuedAt <= queuedAtCutoff ? { ...e, attempts: e.attempts + 1 } : e
    );
    const kept = updated.filter((e) => e.attempts < 5);
    saveQueue(kept);
  }
}

let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushLoop(): void {
  if (typeof window === "undefined") return;
  if (flushTimer) return;
  flushTimer = setInterval(flushQueue, FLUSH_INTERVAL);
}

if (typeof window !== "undefined") {
  startFlushLoop();
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
  _ts?: number;
}

function sendEvent(data: TrackEventPayload): void {
  data._ts = Date.now();
  enqueueEvent(data);
  try {
    const url = `${TRACKING_API}/api/v1/tracking/event`;
    const body = JSON.stringify(data);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).then((res) => {
      if (res.ok) {
        const queue = getQueue();
        const remaining = queue.filter(
          (e) => e.queuedAt !== data._ts
        );
        saveQueue(remaining);
      }
    }).catch(() => {});
  } catch {}
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
