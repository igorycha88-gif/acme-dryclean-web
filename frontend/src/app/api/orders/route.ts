import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { API_BASE_URL } from "@/lib/constants";
import { parsePayload, serviceTitle, type OrderPayload } from "./helpers";

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function buildTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  const host = process.env.SMTP_HOST || "smtp.yandex.ru";
  const tlsServername = process.env.SMTP_TLS_SERVERNAME || host;
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: {
      user: process.env.SMTP_USER as string,
      pass: process.env.SMTP_PASS as string,
    },
    tls: { servername: tlsServername },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

function buildEmail(payload: OrderPayload, referer: string | null) {
  const to = process.env.SMTP_TO || process.env.SMTP_USER;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `Новая заявка: ${serviceTitle(payload.service_type)}`;
  const rows: Array<[string, string]> = [
    ["Имя", payload.name],
    ["Телефон", payload.phone],
    ["Услуга", serviceTitle(payload.service_type)],
    ["Дата", new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })],
  ];
  if (referer) rows.push(["Страница", referer]);

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="border:1px solid #ddd;font-weight:bold;white-space:nowrap">${escapeHtml(
          k
        )}</td><td style="border:1px solid #ddd">${escapeHtml(v)}</td></tr>`
    )
    .join("")}</table>`;

  return { from, to: to as string, subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(payload: OrderPayload, referer: string | null): Promise<void> {
  const transport = buildTransport();
  const options = buildEmail(payload, referer);
  try {
    await transport.sendMail(options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown SMTP error";
    console.error("[orders] SMTP send failed:", message);
    throw err;
  } finally {
    transport.close();
  }
}

async function proxyToLegacyApi(body: unknown): Promise<NextResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "validation_failed" }, { status: 400 });
  }

  if (isSmtpConfigured()) {
    const referer = request.headers.get("referer");
    try {
      await sendEmail(payload, referer);
      return NextResponse.json({ ok: true, channel: "email" });
    } catch {
      return NextResponse.json(
        { ok: false, error: "email_failed" },
        { status: 502 }
      );
    }
  }

  return proxyToLegacyApi(body);
}
