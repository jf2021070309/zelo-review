import crypto from "crypto";
import { execute } from "./db";
import { buildMailto, buildWhatsAppUrl, onlyDigits } from "./qr-types";

/**
 * Envío de avisos al gerente (o al cliente) por WhatsApp y/o correo.
 *
 *  - WhatsApp: WhatsApp Business Platform (Cloud API) si existen
 *      WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID.
 *  - Correo: Resend (https://resend.com) si existe RESEND_API_KEY (+ EMAIL_FROM).
 *  - n8n: si existe N8N_WEBHOOK_URL se envía además el evento completo en JSON,
 *      para que el flujo de n8n haga el ruteo / nodo condicional que prefieras.
 *
 * Si no hay proveedor configurado el aviso queda registrado como SIMULATED con
 * un enlace listo (wa.me / mailto) para enviarlo a mano desde el panel. Así el
 * flujo funciona de punta a punta en local sin credenciales.
 */

export type Channel = "WHATSAPP" | "EMAIL";

export interface NotifyTarget {
  name?: string | null;
  channel: "WHATSAPP" | "EMAIL" | "BOTH";
  whatsapp?: string | null;
  email?: string | null;
}

export interface NotifyInput {
  caseId?: string | null;
  managerId?: string | null;
  audience: "MANAGER" | "CUSTOMER";
  target: NotifyTarget;
  subject: string;
  text: string; // texto plano (WhatsApp y correo)
  html?: string;
  event?: Record<string, any>; // payload para n8n
}

export interface NotifyResult {
  channel: Channel | "WEBHOOK";
  status: "SENT" | "SIMULATED" | "FAILED";
  recipient: string | null;
  deliveryUrl: string | null;
  provider: string;
  error?: string;
}

async function logNotification(input: NotifyInput, r: NotifyResult, body: string) {
  await execute(
    `INSERT INTO notifications (id, caseId, managerId, audience, channel, recipient, subject, body, deliveryUrl, status, provider, error, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
    [
      crypto.randomUUID(),
      input.caseId || null,
      input.managerId || null,
      input.audience,
      r.channel,
      r.recipient,
      input.subject.slice(0, 250),
      body,
      r.deliveryUrl,
      r.status,
      r.provider,
      r.error || null,
    ]
  );
}

async function sendWhatsApp(to: string, text: string): Promise<{ ok: boolean; provider: string; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, provider: "simulado" };
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  const template = process.env.WHATSAPP_TEMPLATE_NAME;
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "es" },
          components: [{ type: "body", parameters: [{ type: "text", text: text.slice(0, 1000) }] }],
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { preview_url: true, body: text.slice(0, 4000) } };
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, provider: "whatsapp-cloud", error: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { ok: true, provider: "whatsapp-cloud" };
  } catch (e: any) {
    return { ok: false, provider: "whatsapp-cloud", error: e?.message || String(e) };
  }
}

async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<{ ok: boolean; provider: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, provider: "simulado" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ZELO Review <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
        html: html || `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</pre>`,
      }),
    });
    if (!res.ok) return { ok: false, provider: "resend", error: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { ok: true, provider: "resend" };
  } catch (e: any) {
    return { ok: false, provider: "resend", error: e?.message || String(e) };
  }
}

async function sendWebhook(event: Record<string, any>): Promise<NotifyResult | null> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return {
      channel: "WEBHOOK",
      status: res.ok ? "SENT" : "FAILED",
      recipient: url.slice(0, 190),
      deliveryUrl: null,
      provider: "n8n",
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e: any) {
    return { channel: "WEBHOOK", status: "FAILED", recipient: url.slice(0, 190), deliveryUrl: null, provider: "n8n", error: e?.message };
  }
}

export async function notify(input: NotifyInput): Promise<NotifyResult[]> {
  const results: NotifyResult[] = [];
  const { target } = input;
  const wantsWa = (target.channel === "WHATSAPP" || target.channel === "BOTH") && onlyDigits(target.whatsapp);
  const wantsMail = (target.channel === "EMAIL" || target.channel === "BOTH") && (target.email || "").includes("@");

  if (wantsWa) {
    const to = onlyDigits(target.whatsapp);
    const r = await sendWhatsApp(to, input.text);
    const res: NotifyResult = {
      channel: "WHATSAPP",
      status: r.ok ? "SENT" : r.provider === "simulado" ? "SIMULATED" : "FAILED",
      recipient: to,
      deliveryUrl: buildWhatsAppUrl(to, input.text),
      provider: r.provider,
      error: r.error,
    };
    results.push(res);
    await logNotification(input, res, input.text);
  }

  if (wantsMail) {
    const to = (target.email || "").trim();
    const r = await sendEmail(to, input.subject, input.text, input.html);
    const res: NotifyResult = {
      channel: "EMAIL",
      status: r.ok ? "SENT" : r.provider === "simulado" ? "SIMULATED" : "FAILED",
      recipient: to,
      deliveryUrl: buildMailto(to, input.subject, input.text).slice(0, 1900),
      provider: r.provider,
      error: r.error,
    };
    results.push(res);
    await logNotification(input, res, input.text);
  }

  if (input.event) {
    const wh = await sendWebhook({ ...input.event, audience: input.audience, subject: input.subject, text: input.text });
    if (wh) {
      results.push(wh);
      await logNotification(input, wh, JSON.stringify(input.event).slice(0, 5000));
    }
  }

  return results;
}

export function providersStatus() {
  return {
    whatsapp: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    email: Boolean(process.env.RESEND_API_KEY),
    n8n: Boolean(process.env.N8N_WEBHOOK_URL),
  };
}
