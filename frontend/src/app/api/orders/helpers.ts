import { SERVICES } from "@/lib/constants";

export interface OrderPayload {
  name: string;
  phone: string;
  service_type: string;
}

export const NAME_RE = /^.{1,100}$/;
export const PHONE_RE = /^[+]?[0-9\s\-\(\)]{7,20}$/;
const CONTROL_CHARS_RE = /[\r\n\u0000-\u001f]+/g;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parsePayload(body: unknown): OrderPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const { name, phone, service_type } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof phone !== "string" || typeof service_type !== "string") {
    return null;
  }
  const cleanName = name.trim().replace(CONTROL_CHARS_RE, " ");
  const cleanPhone = phone.trim().replace(CONTROL_CHARS_RE, "");
  const cleanService = service_type.trim().replace(CONTROL_CHARS_RE, " ");
  if (!NAME_RE.test(cleanName)) return null;
  if (!PHONE_RE.test(cleanPhone)) return null;
  if (cleanService.length === 0) return null;
  return { name: cleanName, phone: cleanPhone, service_type: cleanService };
}

export function serviceTitle(slug: string): string {
  return SERVICES.find((s) => s.slug === slug)?.title ?? slug;
}
