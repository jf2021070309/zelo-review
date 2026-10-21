/**
 * Definición de los tipos de QR del menú de redirecciones (estilo qr.io)
 * + el tipo especial C-03 "Filtro inteligente de reseñas".
 * Este archivo es compartido entre cliente y servidor (sin dependencias de Node).
 */

export type QrType =
  | "LINK"
  | "TEXT"
  | "EMAIL"
  | "CALL"
  | "SMS"
  | "VCARD"
  | "WHATSAPP"
  | "WIFI"
  | "PDF"
  | "APP"
  | "IMAGES"
  | "VIDEO"
  | "SOCIAL"
  | "EVENT"
  | "BARCODE"
  | "REVIEW_FILTER";

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "tel"
  | "email"
  | "select"
  | "datetime"
  | "checkbox"
  | "number"
  | "file"
  | "files"
  | "branch";

export interface QrField {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  accept?: string;
  help?: string;
  half?: boolean;
}

export interface QrTypeDef {
  type: QrType;
  label: string;
  icon: string; // nombre de icono lucide
  description: string;
  /** Puede codificarse directo (sin pasar por nuestro servidor) */
  supportsStatic: boolean;
  /** Requiere pasar por nuestro servidor (landing / lógica) */
  dynamicOnly: boolean;
  fields: QrField[];
}

export const QR_TYPES: QrTypeDef[] = [
  {
    type: "LINK",
    label: "Enlace",
    icon: "Link",
    description: "Redirige a cualquier sitio web.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [{ key: "url", label: "Introduce tu sitio web", kind: "url", placeholder: "https://", required: true }],
  },
  {
    type: "TEXT",
    label: "Texto",
    icon: "AlignLeft",
    description: "Muestra un texto al escanear.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [{ key: "text", label: "Texto", kind: "textarea", placeholder: "Escribe tu mensaje…", required: true }],
  },
  {
    type: "EMAIL",
    label: "E-mail",
    icon: "Mail",
    description: "Abre un correo prellenado.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [
      { key: "to", label: "Correo destino", kind: "email", placeholder: "contacto@negocio.com", required: true },
      { key: "subject", label: "Asunto", kind: "text", placeholder: "Consulta" },
      { key: "body", label: "Mensaje", kind: "textarea", placeholder: "Hola…" },
    ],
  },
  {
    type: "CALL",
    label: "Llamada",
    icon: "PhoneCall",
    description: "Inicia una llamada telefónica.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [{ key: "phone", label: "Número de teléfono", kind: "tel", placeholder: "+51 987 654 321", required: true }],
  },
  {
    type: "SMS",
    label: "SMS",
    icon: "MessageSquareText",
    description: "Envía un SMS prellenado.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [
      { key: "phone", label: "Número", kind: "tel", placeholder: "+51 987 654 321", required: true },
      { key: "message", label: "Mensaje", kind: "textarea", placeholder: "Hola…" },
    ],
  },
  {
    type: "VCARD",
    label: "V-card",
    icon: "Contact",
    description: "Guarda un contacto en el teléfono.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [
      { key: "firstName", label: "Nombre", kind: "text", required: true, half: true },
      { key: "lastName", label: "Apellido", kind: "text", half: true },
      { key: "org", label: "Empresa", kind: "text", half: true },
      { key: "title", label: "Cargo", kind: "text", half: true },
      { key: "phone", label: "Teléfono", kind: "tel", half: true },
      { key: "mobile", label: "Celular", kind: "tel", half: true },
      { key: "email", label: "Correo", kind: "email", half: true },
      { key: "website", label: "Sitio web", kind: "url", half: true },
      { key: "address", label: "Dirección", kind: "text" },
      { key: "note", label: "Nota", kind: "textarea" },
    ],
  },
  {
    type: "WHATSAPP",
    label: "WhatsApp",
    icon: "MessageCircle",
    description: "Abre un chat de WhatsApp.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [
      { key: "phone", label: "Número de WhatsApp (con código de país)", kind: "tel", placeholder: "51987654321", required: true },
      { key: "message", label: "Mensaje inicial", kind: "textarea", placeholder: "¡Hola! Vengo desde el QR." },
    ],
  },
  {
    type: "WIFI",
    label: "WI-FI",
    icon: "Wifi",
    description: "Conecta a una red Wi-Fi.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [
      { key: "ssid", label: "Nombre de la red (SSID)", kind: "text", required: true },
      { key: "password", label: "Contraseña", kind: "text" },
      {
        key: "encryption",
        label: "Seguridad",
        kind: "select",
        options: [
          { value: "WPA", label: "WPA/WPA2" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "Sin contraseña" },
        ],
        half: true,
      },
      { key: "hidden", label: "Red oculta", kind: "checkbox", half: true },
    ],
  },
  {
    type: "PDF",
    label: "PDF",
    icon: "FileText",
    description: "Muestra un PDF (carta, catálogo…).",
    supportsStatic: false,
    dynamicOnly: true,
    fields: [
      { key: "title", label: "Título", kind: "text", placeholder: "Nuestra carta" },
      { key: "fileUrl", label: "Archivo PDF", kind: "file", accept: "application/pdf", required: true, help: "Sube un PDF (máx. 10 MB) o pega un enlace." },
      { key: "description", label: "Descripción", kind: "textarea" },
    ],
  },
  {
    type: "APP",
    label: "Aplicación",
    icon: "Smartphone",
    description: "Envía a App Store o Google Play según el teléfono.",
    supportsStatic: false,
    dynamicOnly: true,
    fields: [
      { key: "appName", label: "Nombre de la app", kind: "text", required: true },
      { key: "iosUrl", label: "Enlace App Store", kind: "url", placeholder: "https://apps.apple.com/…" },
      { key: "androidUrl", label: "Enlace Google Play", kind: "url", placeholder: "https://play.google.com/…" },
      { key: "fallbackUrl", label: "Enlace alternativo (PC)", kind: "url", placeholder: "https://" },
    ],
  },
  {
    type: "IMAGES",
    label: "Imágenes",
    icon: "Images",
    description: "Galería de imágenes.",
    supportsStatic: false,
    dynamicOnly: true,
    fields: [
      { key: "title", label: "Título de la galería", kind: "text", required: true },
      { key: "images", label: "Imágenes", kind: "files", accept: "image/*", required: true, help: "Sube varias imágenes o pega enlaces (uno por línea)." },
      { key: "description", label: "Descripción", kind: "textarea" },
    ],
  },
  {
    type: "VIDEO",
    label: "Vídeo",
    icon: "PlayCircle",
    description: "Reproduce un video (YouTube, Vimeo o archivo).",
    supportsStatic: false,
    dynamicOnly: true,
    fields: [
      { key: "title", label: "Título", kind: "text" },
      { key: "videoUrl", label: "Video", kind: "file", accept: "video/*", required: true, help: "Enlace de YouTube/Vimeo o sube un MP4 (máx. 10 MB)." },
      { key: "description", label: "Descripción", kind: "textarea" },
    ],
  },
  {
    type: "SOCIAL",
    label: "Redes sociales",
    icon: "Share2",
    description: "Página con todas tus redes.",
    supportsStatic: false,
    dynamicOnly: true,
    fields: [
      { key: "title", label: "Nombre a mostrar", kind: "text", required: true },
      { key: "description", label: "Descripción", kind: "textarea" },
      { key: "facebook", label: "Facebook", kind: "url", half: true },
      { key: "instagram", label: "Instagram", kind: "url", half: true },
      { key: "tiktok", label: "TikTok", kind: "url", half: true },
      { key: "youtube", label: "YouTube", kind: "url", half: true },
      { key: "x", label: "X / Twitter", kind: "url", half: true },
      { key: "linkedin", label: "LinkedIn", kind: "url", half: true },
      { key: "whatsapp", label: "WhatsApp (número)", kind: "tel", half: true },
      { key: "website", label: "Sitio web", kind: "url", half: true },
    ],
  },
  {
    type: "EVENT",
    label: "Evento",
    icon: "CalendarDays",
    description: "Agrega un evento al calendario.",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [
      { key: "title", label: "Nombre del evento", kind: "text", required: true },
      { key: "location", label: "Lugar", kind: "text" },
      { key: "start", label: "Inicio", kind: "datetime", required: true, half: true },
      { key: "end", label: "Fin", kind: "datetime", half: true },
      { key: "description", label: "Descripción", kind: "textarea" },
    ],
  },
  {
    type: "BARCODE",
    label: "Código 2D",
    icon: "Barcode",
    description: "Código de barras Code-128 (productos, inventario).",
    supportsStatic: true,
    dynamicOnly: false,
    fields: [{ key: "value", label: "Valor del código", kind: "text", placeholder: "ZL-000123", required: true }],
  },
  {
    type: "REVIEW_FILTER",
    label: "Filtro de reseñas",
    icon: "Star",
    description: "C-03: califica 1–5. 4–5 → reseña pública en Google. 1–3 → aviso privado al gerente.",
    supportsStatic: false,
    dynamicOnly: true,
    fields: [
      { key: "branchId", label: "Sucursal (define a qué gerente avisar)", kind: "branch", required: true },
      { key: "businessName", label: "Nombre del negocio (como aparece en Google)", kind: "text", required: true },
      { key: "googleReviewUrl", label: "Enlace directo de reseña de Google", kind: "url", placeholder: "https://search.google.com/local/writereview?placeid=…", help: "Si lo dejas vacío se usa el de la sucursal." },
      {
        key: "threshold",
        label: "Calificación máxima que se considera negativa",
        kind: "select",
        options: [
          { value: "3", label: "1–3 ★ al gerente · 4–5 ★ a Google (recomendado)" },
          { value: "2", label: "1–2 ★ al gerente · 3–5 ★ a Google" },
          { value: "4", label: "1–4 ★ al gerente · solo 5 ★ a Google" },
        ],
      },
      { key: "question", label: "Pregunta", kind: "text", placeholder: "¿Cómo calificarías tu visita?" },
    ],
  },
];

export function getQrTypeDef(type: string): QrTypeDef | undefined {
  return QR_TYPES.find((t) => t.type === type);
}

/* ---------------------------------------------------------------- helpers */

export function onlyDigits(v?: string | null): string {
  return (v || "").replace(/[^0-9]/g, "");
}

export function withHttp(url?: string | null): string {
  const t = (url || "").trim();
  if (!t) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  if (t.startsWith("/")) return t;
  return `https://${t}`;
}

function escWifi(v: string): string {
  return v.replace(/([\\;,:"])/g, "\\$1");
}

function escIcs(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** "2026-10-21T19:30" (datetime-local) → "20261021T193000" (hora local flotante) */
export function toIcsDate(v?: string): string {
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return "";
  return `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00`;
}

export function buildVCard(d: Record<string, any>): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${d.lastName || ""};${d.firstName || ""};;;`,
    `FN:${[d.firstName, d.lastName].filter(Boolean).join(" ")}`,
  ];
  if (d.org) lines.push(`ORG:${d.org}`);
  if (d.title) lines.push(`TITLE:${d.title}`);
  if (d.phone) lines.push(`TEL;TYPE=WORK,VOICE:${d.phone}`);
  if (d.mobile) lines.push(`TEL;TYPE=CELL:${d.mobile}`);
  if (d.email) lines.push(`EMAIL:${d.email}`);
  if (d.website) lines.push(`URL:${withHttp(d.website)}`);
  if (d.address) lines.push(`ADR;TYPE=WORK:;;${d.address};;;;`);
  if (d.note) lines.push(`NOTE:${String(d.note).replace(/\r?\n/g, "\\n")}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function buildIcs(d: Record<string, any>): string {
  const start = toIcsDate(d.start);
  const end = toIcsDate(d.end) || start;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZELO Review//QR//ES",
    "BEGIN:VEVENT",
    `UID:${start}-${Math.abs(hashString(d.title || "evento"))}@zelo`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escIcs(d.title || "Evento")}`,
    d.location ? `LOCATION:${escIcs(d.location)}` : "",
    d.description ? `DESCRIPTION:${escIcs(d.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function buildWhatsAppUrl(phone?: string, message?: string): string {
  const digits = onlyDigits(phone);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildMailto(to?: string, subject?: string, body?: string): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${(to || "").trim()}${params.length ? "?" + params.join("&") : ""}`;
}

/**
 * Contenido que se codifica directamente dentro del QR (modo estático).
 */
export function buildStaticPayload(type: QrType, d: Record<string, any>): string {
  switch (type) {
    case "LINK":
      return withHttp(d.url);
    case "TEXT":
      return d.text || "";
    case "EMAIL":
      return buildMailto(d.to, d.subject, d.body);
    case "CALL":
      return `tel:${(d.phone || "").replace(/[^0-9+]/g, "")}`;
    case "SMS":
      return `SMSTO:${(d.phone || "").replace(/[^0-9+]/g, "")}:${d.message || ""}`;
    case "WHATSAPP":
      return buildWhatsAppUrl(d.phone, d.message);
    case "WIFI": {
      const enc = d.encryption || "WPA";
      let s = `WIFI:T:${enc};S:${escWifi(d.ssid || "")};`;
      if (enc !== "nopass") s += `P:${escWifi(d.password || "")};`;
      if (d.hidden) s += "H:true;";
      return s + ";";
    }
    case "VCARD":
      return buildVCard(d);
    case "EVENT":
      return buildIcs(d).replace(/^BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:[^\r]+\r\n/, "").replace(/\r\nEND:VCALENDAR$/, "");
    case "BARCODE":
      return d.value || "";
    default:
      return "";
  }
}

/** Valida campos requeridos. Devuelve mensaje de error o null. */
export function validateQrData(type: QrType, d: Record<string, any>): string | null {
  const def = getQrTypeDef(type);
  if (!def) return "Tipo de QR no válido";
  for (const f of def.fields) {
    if (!f.required) continue;
    const v = d?.[f.key];
    const empty = Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim();
    if (empty) return `El campo "${f.label}" es obligatorio`;
  }
  if (type === "APP" && !d.iosUrl && !d.androidUrl && !d.fallbackUrl) {
    return "Ingresa al menos un enlace (App Store, Google Play o alternativo)";
  }
  if (type === "BARCODE" && /[^\x20-\x7E]/.test(d.value || "")) {
    return "El código de barras solo admite caracteres ASCII (sin tildes ni ñ)";
  }
  return null;
}

/* ------------------------------------------------ Code-128 (set B) a SVG */

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232",
];
const CODE128_STOP = "2331112";

export function code128Widths(value: string): number[] {
  const codes: number[] = [104]; // Start B
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 126) throw new Error("Carácter no soportado en Code-128: " + ch);
    codes.push(c - 32);
  }
  let checksum = 104;
  for (let i = 1; i < codes.length; i++) checksum += codes[i] * i;
  codes.push(checksum % 103);
  const pattern = codes.map((c) => CODE128_PATTERNS[c]).join("") + CODE128_STOP;
  return pattern.split("").map(Number);
}

export function buildBarcodeSvg(value: string, opts?: { fg?: string; bg?: string; height?: number }): string {
  const widths = code128Widths(value);
  const unit = 3;
  const quiet = 10 * unit;
  const total = widths.reduce((a, b) => a + b, 0) * unit + quiet * 2;
  const barH = opts?.height || 140;
  const H = barH + 50;
  const fg = opts?.fg || "#000000";
  const bg = opts?.bg || "#ffffff";
  let x = quiet;
  let bars = "";
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars += `<rect x="${x}" y="20" width="${w * unit}" height="${barH}" fill="${fg}"/>`;
    x += w * unit;
  });
  const safe = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${H}" width="${total}" height="${H}"><rect width="100%" height="100%" fill="${bg}"/>${bars}<text x="${total / 2}" y="${barH + 44}" font-family="Courier New, monospace" font-size="22" font-weight="700" text-anchor="middle" fill="${fg}">${safe}</text></svg>`;
}
