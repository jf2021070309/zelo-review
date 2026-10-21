import crypto from "crypto";
import { execute, query, queryOne } from "./db";
import { ensureReviewSchema } from "./review-schema";
import { notify, NotifyResult } from "./notify";
import { withHttp } from "./qr-types";

/* =========================================================================
 * Lógica del C-03 "Filtro inteligente de reseñas"
 *  - Calificación > umbral  → reseña pública (se registra y se ofrece Google)
 *  - Calificación ≤ umbral  → NO se ofrece Google; se abre un caso privado,
 *                             se avisa al gerente de la sucursal y se abre un
 *                             chat bidireccional gerente ↔ cliente.
 *  - El gerente puede invitar a re-calificar; si la nueva nota supera el
 *    umbral, la reseña pasa a RECOVERED y se publica.
 *  - Un único recordatorio suave si el cliente no responde, y un seguimiento
 *    opcional a los N días ("¿quedó resuelta tu queja?").
 * ========================================================================= */

export type CaseStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "RECOVERED" | "CLOSED";

const token = (p: string) => `${p}_${crypto.randomBytes(18).toString("base64url")}`;

export function formatLimaDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.APP_TIMEZONE || "America/Lima",
  }).format(d);
}

export interface ReviewQrContext {
  qr: any;
  data: Record<string, any>;
  branch: any | null;
  manager: any | null;
  threshold: number;
  googleReviewUrl: string;
  businessName: string;
}

export async function loadReviewQr(code: string): Promise<ReviewQrContext | null> {
  await ensureReviewSchema();
  const qr = await queryOne<any>("SELECT * FROM qr_codes WHERE code = ? AND type = 'REVIEW_FILTER' LIMIT 1", [code.toUpperCase()]);
  if (!qr) return null;
  let data: Record<string, any> = {};
  try {
    data = JSON.parse(qr.data || "{}");
  } catch {}
  const branchId = qr.branchId || data.branchId || null;
  const branch = branchId ? await queryOne<any>("SELECT * FROM branches WHERE id = ? LIMIT 1", [branchId]) : null;
  const manager = branch?.managerId
    ? await queryOne<any>("SELECT * FROM managers WHERE id = ? AND isActive = 1 LIMIT 1", [branch.managerId])
    : null;
  const threshold = Math.min(4, Math.max(1, parseInt(String(data.threshold || "3"), 10) || 3));
  return {
    qr,
    data,
    branch,
    manager,
    threshold,
    googleReviewUrl: withHttp(data.googleReviewUrl || branch?.googleReviewUrl || "") || "https://search.google.com/local/writereview",
    businessName: data.businessName || qr.name,
  };
}

export interface SubmitReviewInput {
  code: string;
  rating: number;
  comment?: string;
  authorName?: string;
  customerPhone?: string;
  customerEmail?: string;
  baseUrl: string;
}

export type SubmitReviewResult =
  | { outcome: "PUBLIC"; reviewId: string; googleReviewUrl: string }
  | { outcome: "PRIVATE"; reviewId: string; caseId: string; customerToken: string; notified: NotifyResult[]; managerName: string | null; alwaysOfferGoogle: boolean; googleReviewUrl: string };

export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const ctx = await loadReviewQr(input.code);
  if (!ctx) throw new HttpError(404, "Código QR no encontrado");
  if (ctx.qr.status !== "ACTIVE") throw new HttpError(403, "Este QR está pausado");
  const rating = Math.round(Number(input.rating));
  if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, "La calificación debe ser de 1 a 5");

  const authorName = (input.authorName || "").trim().slice(0, 120) || "Cliente";
  const comment = (input.comment || "").trim().slice(0, 4000) || null;
  const reviewId = crypto.randomUUID();
  const branchId = ctx.branch?.id || null;

  if (rating > ctx.threshold) {
    await execute(
      `INSERT INTO reviews (id, qrId, branchId, authorName, rating, originalRating, comment, status, publishedAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', NOW(3), NOW(3))`,
      [reviewId, ctx.qr.id, branchId, authorName, rating, rating, comment]
    );
    return { outcome: "PUBLIC", reviewId, googleReviewUrl: ctx.googleReviewUrl };
  }

  // ---- Calificación baja: caso privado
  await execute(
    `INSERT INTO reviews (id, qrId, branchId, authorName, rating, originalRating, comment, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'INTERCEPTED', NOW(3))`,
    [reviewId, ctx.qr.id, branchId, authorName, rating, rating, comment]
  );

  const caseId = crypto.randomUUID();
  const customerToken = token("c");
  const managerToken = token("m");
  const phone = (input.customerPhone || "").replace(/[^0-9+]/g, "").slice(0, 20) || null;
  const email = (input.customerEmail || "").trim().slice(0, 190) || null;

  await execute(
    `INSERT INTO review_cases (id, reviewId, qrId, branchId, managerId, customerName, customerPhone, customerEmail, feedback, status, customerToken, managerToken, lastCustomerMsgAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, NOW(3), NOW(3))`,
    [caseId, reviewId, ctx.qr.id, branchId, ctx.manager?.id || null, authorName, phone, email, comment, customerToken, managerToken]
  );

  await addMessage(caseId, "SYSTEM", "TEXT", `Calificación recibida: ${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5). Se avisó en privado al gerente${ctx.manager ? ` ${ctx.manager.name}` : ""}.`);
  if (comment) await addMessage(caseId, "CUSTOMER", "TEXT", comment);

  const when = formatLimaDate();
  const managerLink = `${input.baseUrl}/atencion/${managerToken}`;
  const text =
    `⚠️ *Alerta de reseña negativa* — ${ctx.businessName}\n` +
    `Sucursal: ${ctx.branch?.name || "Sin sucursal"}\n` +
    `Hora: ${when}\n` +
    `Calificación: ${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)\n` +
    `Cliente: ${authorName}${phone ? ` · WhatsApp ${phone}` : ""}${email ? ` · ${email}` : ""}\n` +
    `¿Qué podemos mejorar?: ${comment || "(sin comentario)"}\n\n` +
    `Responde al cliente aquí: ${managerLink}`;

  let notified: NotifyResult[] = [];
  if (ctx.manager) {
    notified = await notify({
      caseId,
      managerId: ctx.manager.id,
      audience: "MANAGER",
      target: ctx.manager,
      subject: `Reseña ${rating}★ en ${ctx.branch?.name || ctx.businessName} — atender ahora`,
      text,
      event: {
        type: "review.intercepted",
        caseId,
        rating,
        comment,
        branch: ctx.branch?.name || null,
        branchId,
        manager: { id: ctx.manager.id, name: ctx.manager.name, whatsapp: ctx.manager.whatsapp, email: ctx.manager.email, channel: ctx.manager.channel },
        customer: { name: authorName, phone, email },
        managerLink,
        customerLink: `${input.baseUrl}/c/${customerToken}`,
        at: new Date().toISOString(),
      },
    });
  }

  return {
    outcome: "PRIVATE",
    reviewId,
    caseId,
    customerToken,
    notified,
    managerName: ctx.manager?.name || null,
    alwaysOfferGoogle: Boolean(ctx.data.alwaysOfferGoogle),
    googleReviewUrl: ctx.googleReviewUrl,
  };
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function addMessage(caseId: string, sender: "CUSTOMER" | "MANAGER" | "SYSTEM", kind: string, body: string) {
  const id = crypto.randomUUID();
  await execute(
    "INSERT INTO case_messages (id, caseId, sender, kind, body, createdAt) VALUES (?, ?, ?, ?, ?, NOW(3))",
    [id, caseId, sender, kind, body.slice(0, 4000)]
  );
  return id;
}

/* ------------------------------------------------------------- hilo / chat */

export interface ThreadView {
  role: "CUSTOMER" | "MANAGER";
  case: any;
  review: any;
  branch: any | null;
  manager: any | null;
  businessName: string;
  threshold: number;
  googleReviewUrl: string;
  messages: any[];
  notifications?: any[];
}

async function loadCaseByToken(tok: string): Promise<{ role: "CUSTOMER" | "MANAGER"; c: any } | null> {
  await ensureReviewSchema();
  const c = await queryOne<any>("SELECT * FROM review_cases WHERE customerToken = ? OR managerToken = ? LIMIT 1", [tok, tok]);
  if (!c) return null;
  return { role: c.managerToken === tok ? "MANAGER" : "CUSTOMER", c };
}

export async function getThread(tok: string): Promise<ThreadView | null> {
  const found = await loadCaseByToken(tok);
  if (!found) return null;
  const { role, c } = found;
  const review = await queryOne<any>("SELECT * FROM reviews WHERE id = ? LIMIT 1", [c.reviewId]);
  const qr = c.qrId ? await queryOne<any>("SELECT * FROM qr_codes WHERE id = ? LIMIT 1", [c.qrId]) : null;
  let data: any = {};
  try {
    data = JSON.parse(qr?.data || "{}");
  } catch {}
  const branch = c.branchId ? await queryOne<any>("SELECT * FROM branches WHERE id = ? LIMIT 1", [c.branchId]) : null;
  const manager = c.managerId ? await queryOne<any>("SELECT id, name, role, channel, whatsapp, email FROM managers WHERE id = ? LIMIT 1", [c.managerId]) : null;
  const messages = await query<any>("SELECT id, sender, kind, body, createdAt FROM case_messages WHERE caseId = ? ORDER BY createdAt ASC", [c.id]);
  const notifications =
    role === "MANAGER"
      ? await query<any>("SELECT id, audience, channel, recipient, status, provider, deliveryUrl, error, createdAt FROM notifications WHERE caseId = ? ORDER BY createdAt DESC", [c.id])
      : undefined;

  const safeCase =
    role === "MANAGER"
      ? c
      : { id: c.id, status: c.status, customerName: c.customerName, createdAt: c.createdAt, rerateInvitedAt: c.rerateInvitedAt, newRating: c.newRating, customerToken: c.customerToken };

  return {
    role,
    case: safeCase,
    review: review ? { id: review.id, rating: review.rating, originalRating: review.originalRating, comment: review.comment, status: review.status, authorName: review.authorName } : null,
    branch: branch ? { id: branch.id, name: branch.name, address: branch.address } : null,
    manager: manager ? (role === "MANAGER" ? manager : { name: manager.name, role: manager.role }) : null,
    businessName: data.businessName || qr?.name || "Negocio",
    threshold: Math.min(4, Math.max(1, parseInt(String(data.threshold || "3"), 10) || 3)),
    googleReviewUrl: withHttp(data.googleReviewUrl || branch?.googleReviewUrl || "") || "https://search.google.com/local/writereview",
    messages,
    notifications,
  };
}

export async function postThreadMessage(tok: string, body: string, baseUrl: string) {
  const found = await loadCaseByToken(tok);
  if (!found) throw new HttpError(404, "Conversación no encontrada");
  const text = (body || "").trim();
  if (!text) throw new HttpError(400, "Mensaje vacío");
  const { role, c } = found;
  if (c.status === "CLOSED") throw new HttpError(409, "La conversación está cerrada");
  await addMessage(c.id, role, "TEXT", text);

  if (role === "MANAGER") {
    await execute(
      `UPDATE review_cases SET lastManagerMsgAt = NOW(3), status = IF(status = 'OPEN', 'IN_PROGRESS', status) WHERE id = ?`,
      [c.id]
    );
    // Avisar al cliente si dejó contacto
    if (c.customerPhone || c.customerEmail) {
      const mgr = c.managerId ? await queryOne<any>("SELECT name FROM managers WHERE id = ?", [c.managerId]) : null;
      await notify({
        caseId: c.id,
        audience: "CUSTOMER",
        target: { channel: c.customerPhone && c.customerEmail ? "BOTH" : c.customerPhone ? "WHATSAPP" : "EMAIL", whatsapp: c.customerPhone, email: c.customerEmail },
        subject: "Respuesta sobre tu visita",
        text: `Hola ${c.customerName || ""}, ${mgr?.name || "el gerente"} te respondió:\n\n"${text}"\n\nContinúa la conversación aquí: ${baseUrl}/c/${c.customerToken}`,
      });
    }
  } else {
    await execute(`UPDATE review_cases SET lastCustomerMsgAt = NOW(3) WHERE id = ?`, [c.id]);
    // Avisar al gerente (máximo 1 aviso cada 5 minutos por caso)
    const recent = await queryOne<any>(
      `SELECT id FROM notifications WHERE caseId = ? AND audience = 'MANAGER' AND createdAt > (NOW(3) - INTERVAL 5 MINUTE) LIMIT 1`,
      [c.id]
    );
    if (!recent && c.managerId) {
      const mgr = await queryOne<any>("SELECT * FROM managers WHERE id = ?", [c.managerId]);
      if (mgr) {
        await notify({
          caseId: c.id,
          managerId: mgr.id,
          audience: "MANAGER",
          target: mgr,
          subject: `Nuevo mensaje de ${c.customerName || "cliente"}`,
          text: `💬 ${c.customerName || "El cliente"} escribió: "${text}"\nResponder: ${baseUrl}/atencion/${c.managerToken}`,
        });
      }
    }
  }
  return { ok: true };
}

export async function inviteRerate(tok: string, baseUrl: string) {
  const found = await loadCaseByToken(tok);
  if (!found || found.role !== "MANAGER") throw new HttpError(403, "Solo el gerente puede invitar a re-calificar");
  const { c } = found;
  await addMessage(c.id, "MANAGER", "RERATE_INVITE", "Gracias por darnos la oportunidad de corregirlo. Si sientes que lo resolvimos, ¿te gustaría actualizar tu calificación?");
  await execute("UPDATE review_cases SET rerateInvitedAt = NOW(3), lastManagerMsgAt = NOW(3), status = IF(status = 'OPEN', 'IN_PROGRESS', status) WHERE id = ?", [c.id]);
  if (c.customerPhone || c.customerEmail) {
    await notify({
      caseId: c.id,
      audience: "CUSTOMER",
      target: { channel: c.customerPhone && c.customerEmail ? "BOTH" : c.customerPhone ? "WHATSAPP" : "EMAIL", whatsapp: c.customerPhone, email: c.customerEmail },
      subject: "¿Actualizarías tu calificación?",
      text: `Hola ${c.customerName || ""}, gracias por darnos la oportunidad de mejorar. Si quedaste conforme puedes actualizar tu calificación aquí: ${baseUrl}/c/${c.customerToken}`,
    });
  }
  return { ok: true };
}

export async function rerate(tok: string, rating: number, comment?: string) {
  const found = await loadCaseByToken(tok);
  if (!found || found.role !== "CUSTOMER") throw new HttpError(403, "Solo el cliente puede actualizar su calificación");
  const { c } = found;
  const r = Math.round(Number(rating));
  if (!(r >= 1 && r <= 5)) throw new HttpError(400, "La calificación debe ser de 1 a 5");
  const thread = await getThread(tok);
  const threshold = thread?.threshold ?? 3;
  const recovered = r > threshold;
  const newComment = (comment || "").trim().slice(0, 4000) || null;

  await execute(
    `UPDATE reviews SET rating = ?, comment = COALESCE(?, comment), status = ?, publishedAt = IF(? = 1, NOW(3), publishedAt) WHERE id = ?`,
    [r, newComment, recovered ? "RECOVERED" : "INTERCEPTED", recovered ? 1 : 0, c.reviewId]
  );
  await execute(
    `UPDATE review_cases SET newRating = ?, status = ?, lastCustomerMsgAt = NOW(3) WHERE id = ?`,
    [r, recovered ? "RECOVERED" : c.status === "OPEN" ? "IN_PROGRESS" : c.status, c.id]
  );
  await addMessage(
    c.id,
    "CUSTOMER",
    "RATING_UPDATE",
    `Actualizó su calificación a ${"★".repeat(r)}${"☆".repeat(5 - r)} (${r}/5)${newComment ? `: "${newComment}"` : ""}`
  );
  if (c.managerId) {
    const mgr = await queryOne<any>("SELECT * FROM managers WHERE id = ?", [c.managerId]);
    if (mgr) {
      await notify({
        caseId: c.id,
        managerId: mgr.id,
        audience: "MANAGER",
        target: mgr,
        subject: recovered ? `✅ Cliente recuperado (${r}★)` : `Cliente actualizó su nota (${r}★)`,
        text: recovered
          ? `✅ ${c.customerName || "El cliente"} actualizó su calificación a ${r}★. La reseña quedó registrada como recuperada.`
          : `${c.customerName || "El cliente"} actualizó su calificación a ${r}★ (sigue siendo baja).`,
        event: { type: recovered ? "review.recovered" : "review.rerated", caseId: c.id, rating: r },
      });
    }
  }
  return { ok: true, recovered, rating: r, googleReviewUrl: thread?.googleReviewUrl || null };
}

export async function setCaseStatus(tok: string, status: CaseStatus) {
  const found = await loadCaseByToken(tok);
  if (!found || found.role !== "MANAGER") throw new HttpError(403, "No autorizado");
  if (!["OPEN", "IN_PROGRESS", "RESOLVED", "RECOVERED", "CLOSED"].includes(status)) throw new HttpError(400, "Estado inválido");
  await execute("UPDATE review_cases SET status = ? WHERE id = ?", [status, found.c.id]);
  const labels: Record<string, string> = { RESOLVED: "marcó el caso como resuelto", CLOSED: "cerró la conversación", IN_PROGRESS: "reabrió el caso", OPEN: "reabrió el caso", RECOVERED: "marcó al cliente como recuperado" };
  await addMessage(found.c.id, "SYSTEM", "TEXT", `El gerente ${labels[status]}.`);
  return { ok: true };
}

/* --------------------------------------------- recordatorio y seguimiento */

export async function runFollowUps(baseUrl: string) {
  await ensureReviewSchema();
  const reminderMin = parseInt(process.env.REMINDER_AFTER_MINUTES || "1440", 10); // 24 h
  const followUpMin = parseInt(process.env.FOLLOWUP_AFTER_MINUTES || "2880", 10); // 2 días
  let reminders = 0;
  let followUps = 0;

  // 1) Un único recordatorio suave si el gerente escribió y el cliente no respondió
  const pending = await query<any>(
    `SELECT * FROM review_cases
     WHERE reminderSentAt IS NULL AND lastManagerMsgAt IS NOT NULL
       AND (lastCustomerMsgAt IS NULL OR lastCustomerMsgAt < lastManagerMsgAt)
       AND lastManagerMsgAt < (NOW(3) - INTERVAL ? MINUTE)
       AND status IN ('OPEN','IN_PROGRESS')`,
    [reminderMin]
  );
  for (const c of pending) {
    await addMessage(c.id, "SYSTEM", "REMINDER", "Recordatorio: el gerente te escribió y espera tu respuesta. Sin presión 🙂");
    await execute("UPDATE review_cases SET reminderSentAt = NOW(3) WHERE id = ?", [c.id]);
    if (c.customerPhone || c.customerEmail) {
      await notify({
        caseId: c.id,
        audience: "CUSTOMER",
        target: { channel: c.customerPhone && c.customerEmail ? "BOTH" : c.customerPhone ? "WHATSAPP" : "EMAIL", whatsapp: c.customerPhone, email: c.customerEmail },
        subject: "Tienes una respuesta pendiente",
        text: `Hola ${c.customerName || ""}, solo un recordatorio amable: te respondimos sobre tu visita. Puedes verlo aquí: ${baseUrl}/c/${c.customerToken}`,
      });
    }
    reminders++;
  }

  // 2) Seguimiento a los N días: ¿quedó resuelta la queja?
  const due = await query<any>(
    `SELECT * FROM review_cases
     WHERE followUpSentAt IS NULL AND createdAt < (NOW(3) - INTERVAL ? MINUTE)
       AND status IN ('OPEN','IN_PROGRESS','RESOLVED')`,
    [followUpMin]
  );
  for (const c of due) {
    await addMessage(c.id, "SYSTEM", "FOLLOW_UP", "Seguimiento: ¿tu queja quedó resuelta? Puedes responder aquí o actualizar tu calificación.");
    await execute("UPDATE review_cases SET followUpSentAt = NOW(3) WHERE id = ?", [c.id]);
    if (c.customerPhone || c.customerEmail) {
      await notify({
        caseId: c.id,
        audience: "CUSTOMER",
        target: { channel: c.customerPhone && c.customerEmail ? "BOTH" : c.customerPhone ? "WHATSAPP" : "EMAIL", whatsapp: c.customerPhone, email: c.customerEmail },
        subject: "¿Quedó resuelta tu queja?",
        text: `Hola ${c.customerName || ""}, hace unos días nos contaste que algo no salió bien. ¿Quedó resuelto? Cuéntanos aquí: ${baseUrl}/c/${c.customerToken}`,
      });
    }
    followUps++;
  }
  return { reminders, followUps };
}

/* ------------------------------------------------------------ panel admin */

export async function getInbox() {
  await ensureReviewSchema();
  const cases = await query<any>(
    `SELECT rc.id, rc.status, rc.customerName, rc.customerPhone, rc.customerEmail, rc.feedback, rc.managerToken,
            rc.createdAt, rc.updatedAt, rc.newRating, rc.reminderSentAt, rc.followUpSentAt,
            r.rating, r.originalRating, r.status AS reviewStatus,
            b.name AS branchName, m.name AS managerName, m.channel AS managerChannel,
            (SELECT COUNT(*) FROM case_messages cm WHERE cm.caseId = rc.id) AS messageCount,
            (SELECT sender FROM case_messages cm2 WHERE cm2.caseId = rc.id ORDER BY cm2.createdAt DESC LIMIT 1) AS lastSender
     FROM review_cases rc
     LEFT JOIN reviews r ON r.id = rc.reviewId
     LEFT JOIN branches b ON b.id = rc.branchId
     LEFT JOIN managers m ON m.id = rc.managerId
     ORDER BY rc.createdAt DESC
     LIMIT 300`
  );
  const reviews = await query<any>(
    `SELECT r.id, r.authorName, r.rating, r.originalRating, r.comment, r.status, r.createdAt, r.publishedAt,
            b.name AS branchName, q.name AS qrName, q.code AS qrCode
     FROM reviews r
     LEFT JOIN branches b ON b.id = r.branchId
     LEFT JOIN qr_codes q ON q.id = r.qrId
     ORDER BY r.createdAt DESC
     LIMIT 300`
  );
  const stats = await queryOne<any>(
    `SELECT COUNT(*) AS total,
            SUM(status = 'PUBLISHED') AS published,
            SUM(status = 'INTERCEPTED') AS intercepted,
            SUM(status = 'RECOVERED') AS recovered,
            ROUND(AVG(CASE WHEN status IN ('PUBLISHED','RECOVERED') THEN rating END), 2) AS publicAvg,
            ROUND(AVG(originalRating), 2) AS rawAvg
     FROM reviews`
  );
  const notifications = await query<any>(
    `SELECT n.id, n.audience, n.channel, n.recipient, n.subject, n.status, n.provider, n.deliveryUrl, n.error, n.createdAt
     FROM notifications n ORDER BY n.createdAt DESC LIMIT 50`
  );
  return {
    cases: cases.map((c) => ({ ...c, messageCount: Number(c.messageCount || 0) })),
    reviews,
    stats: {
      total: Number(stats?.total || 0),
      published: Number(stats?.published || 0),
      intercepted: Number(stats?.intercepted || 0),
      recovered: Number(stats?.recovered || 0),
      publicAvg: stats?.publicAvg != null ? Number(stats.publicAvg) : null,
      rawAvg: stats?.rawAvg != null ? Number(stats.rawAvg) : null,
    },
    notifications,
  };
}
