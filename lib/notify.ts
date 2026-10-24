import crypto from "crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { execute } from "./db";
import { buildMailto } from "./qr-types";

/**
 * Envío directo de avisos por correo usando el servidor SMTP de ZELO (Zoho Mail).
 * Se eliminó WhatsApp para enviar todas las alertas directamente al correo registrado del negocio.
 */

export type Channel = "EMAIL" | "WEBHOOK";

export interface NotifyTarget {
  name?: string | null;
  email?: string | null;
  managerEmail?: string | null;
  channel?: string | null;
  [key: string]: any;
}

export interface NotifyInput {
  caseId?: string | null;
  managerId?: string | null;
  audience: "MANAGER" | "CUSTOMER";
  target: NotifyTarget;
  subject: string;
  text: string;
  html?: string;
  event?: Record<string, any>;
}

export interface NotifyResult {
  channel: Channel | string;
  status: "SENT" | "SIMULATED" | "FAILED";
  recipient: string | null;
  deliveryUrl: string | null;
  provider: string;
  error?: string;
}

let cachedTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "jaime.flores01@zelo.com.mx";
  const pass = process.env.SMTP_PASS || "cwiE6uc&";

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
  });

  return cachedTransporter;
}

/**
 * Plantilla HTML con diseño moderno y colores de marca ZELO
 */
export function buildStyledEmailHtml(subject: string, text: string): string {
  // Extraer enlace de atención si existe en el texto
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  const actionUrl = urlMatch ? urlMatch[0] : null;

  // Convertir saltos de línea y formatear negritas de markdown
  const formattedBody = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
    .replace(/(★+|☆+)/g, '<span style="color:#f59e0b;font-size:16px;letter-spacing:2px;">$1</span>')
    .replace(/\n/g, "<br/>");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #030712; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #0a0f1d; border: 1px solid rgba(0, 210, 180, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Encabezado con Marca ZELO -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background: linear-gradient(180deg, rgba(0, 210, 180, 0.08) 0%, rgba(10, 15, 29, 0) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 3px; color: #00d2b4;">Z E L O</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                Sistema Inteligente de Alertas de Reseñas
              </p>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding: 32px;">
              <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #f87171;">
                  ⚠️ Nueva Alerta: Atención Inmediata Requerida
                </p>
              </div>

              <div style="font-size: 14px; line-height: 1.65; color: #cbd5e1; background-color: #040814; padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.06);">
                ${formattedBody}
              </div>

              ${
                actionUrl
                  ? `
              <div style="text-align: center; margin-top: 28px;">
                <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d2b4 0%, #0284c7 100%); color: #030712; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(0, 210, 180, 0.35);">
                  👉 Responder y Atender Cliente Ahora
                </a>
              </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="padding: 20px 32px; background-color: #060a14; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Notificación enviada directamente al correo del negocio vía <strong>SMTP ZELO Oficial</strong>.<br/>
                Placas Inteligentes NFC + Códigos QR · <a href="https://zelo.com.mx" style="color: #00d2b4; text-decoration: none;">zelo.com.mx</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function logNotification(input: NotifyInput, r: NotifyResult, body: string) {
  try {
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
  } catch (err) {
    console.warn("Error al registrar notificación en base de datos:", err);
  }
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ ok: boolean; provider: string; error?: string }> {
  try {
    const transporter = getSmtpTransporter();
    const from = process.env.EMAIL_FROM || '"ZELO Review" <jaime.flores01@zelo.com.mx>';

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || buildStyledEmailHtml(subject, text),
    });

    return { ok: true, provider: "zelo-smtp" };
  } catch (e: any) {
    console.error("Error enviando correo SMTP:", e);
    return { ok: false, provider: "zelo-smtp", error: e?.message || String(e) };
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
    return {
      channel: "WEBHOOK",
      status: "FAILED",
      recipient: url.slice(0, 190),
      deliveryUrl: null,
      provider: "n8n",
      error: e?.message,
    };
  }
}

export async function notify(input: NotifyInput): Promise<NotifyResult[]> {
  const results: NotifyResult[] = [];
  const { target } = input;

  // Se extrae directamente el correo ingresado para el negocio o gerente
  const rawEmail = (target.email || target.managerEmail || "").trim();
  const hasValidEmail = rawEmail.includes("@");

  if (hasValidEmail) {
    const to = rawEmail;
    const r = await sendEmail(to, input.subject, input.text, input.html);
    const res: NotifyResult = {
      channel: "EMAIL",
      status: r.ok ? "SENT" : "FAILED",
      recipient: to,
      deliveryUrl: buildMailto(to, input.subject, input.text).slice(0, 1900),
      provider: r.provider,
      error: r.error,
    };
    results.push(res);
    await logNotification(input, res, input.text);
  }

  // Webhook complementario si está configurado (ej: n8n)
  if (input.event) {
    const wh = await sendWebhook({
      ...input.event,
      audience: input.audience,
      subject: input.subject,
      text: input.text,
    });
    if (wh) {
      results.push(wh);
      await logNotification(input, wh, JSON.stringify(input.event).slice(0, 5000));
    }
  }

  return results;
}

export function providersStatus() {
  return {
    smtp: true,
    email: true,
    n8n: Boolean(process.env.N8N_WEBHOOK_URL),
  };
}
