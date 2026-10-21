/**
 * Render de QR personalizado a SVG (marco, forma de módulos, ojos, colores, logo).
 * Funciona en el navegador y en el servidor (solo usa la librería `qrcode` para la matriz).
 */
import QRCode from "qrcode";

export type DotStyle = "square" | "rounded" | "dots" | "classy";
export type EyeStyle = "square" | "rounded" | "circle";
export type FrameStyle = "none" | "bottom" | "top" | "badge" | "phone" | "clipboard" | "bubble" | "circle";

export interface QrDesign {
  fg: string;
  bg: string;
  eyeColor?: string;
  dotStyle: DotStyle;
  eyeStyle: EyeStyle;
  frame: FrameStyle;
  frameColor: string;
  frameText: string;
  frameTextColor?: string;
  logo?: string | null; // data URL o URL
  logoSize?: number; // 0.15 – 0.3
}

export const DEFAULT_DESIGN: QrDesign = {
  fg: "#111827",
  bg: "#ffffff",
  eyeColor: "#111827",
  dotStyle: "square",
  eyeStyle: "square",
  frame: "none",
  frameColor: "#111827",
  frameText: "SCAN ME",
  frameTextColor: "#ffffff",
  logo: null,
  logoSize: 0.22,
};

export const FRAME_OPTIONS: { value: FrameStyle; label: string }[] = [
  { value: "none", label: "Sin marco" },
  { value: "bottom", label: "Etiqueta abajo" },
  { value: "top", label: "Etiqueta arriba" },
  { value: "badge", label: "Píldora" },
  { value: "phone", label: "Teléfono" },
  { value: "clipboard", label: "Portapapeles" },
  { value: "bubble", label: "Globo" },
  { value: "circle", label: "Círculo" },
];

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Dibuja solo el cuadro del QR (sin marco). Devuelve contenido SVG en un área de `px` x `px`. */
function renderQrBody(text: string, d: QrDesign, px: number): string {
  const qr = QRCode.create(text || " ", { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const quiet = 2;
  const cell = px / (size + quiet * 2);
  const off = quiet * cell;
  const isOn = (r: number, c: number) => r >= 0 && c >= 0 && r < size && c < size && !!data[r * size + c];

  const inEye = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  // Zona del logo (excavada)
  let logoBox: { r0: number; r1: number } | null = null;
  if (d.logo) {
    const ls = Math.max(0.12, Math.min(0.3, d.logoSize || 0.22));
    const n = Math.ceil(size * ls) | 1;
    const r0 = Math.floor((size - n) / 2) - 1;
    logoBox = { r0, r1: r0 + n + 1 };
  }
  const inLogo = (r: number, c: number) =>
    !!logoBox && r >= logoBox.r0 && r <= logoBox.r1 && c >= logoBox.r0 && c <= logoBox.r1;

  let dots = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isOn(r, c) || inEye(r, c) || inLogo(r, c)) continue;
      const x = off + c * cell;
      const y = off + r * cell;
      switch (d.dotStyle) {
        case "dots":
          dots += `<circle cx="${(x + cell / 2).toFixed(2)}" cy="${(y + cell / 2).toFixed(2)}" r="${(cell * 0.52).toFixed(2)}"/>`;
          break;
        case "rounded":
          dots += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cell + 0.3).toFixed(2)}" height="${(cell + 0.3).toFixed(2)}" rx="${(cell * 0.35).toFixed(2)}"/>`;
          break;
        case "classy": {
          // esquinas redondeadas solo donde no hay vecinos
          const t = !isOn(r - 1, c), b = !isOn(r + 1, c), l = !isOn(r, c - 1), rr = !isOn(r, c + 1);
          const k = cell * 0.5;
          const w = cell + 0.3;
          const tl = t && l ? k : 0, tr = t && rr ? k : 0, br = b && rr ? k : 0, bl = b && l ? k : 0;
          dots += `<path d="M${(x + tl).toFixed(2)} ${y.toFixed(2)}H${(x + w - tr).toFixed(2)}${tr ? `A${tr} ${tr} 0 0 1 ${(x + w).toFixed(2)} ${(y + tr).toFixed(2)}` : ""}V${(y + w - br).toFixed(2)}${br ? `A${br} ${br} 0 0 1 ${(x + w - br).toFixed(2)} ${(y + w).toFixed(2)}` : ""}H${(x + bl).toFixed(2)}${bl ? `A${bl} ${bl} 0 0 1 ${x.toFixed(2)} ${(y + w - bl).toFixed(2)}` : ""}V${(y + tl).toFixed(2)}${tl ? `A${tl} ${tl} 0 0 1 ${(x + tl).toFixed(2)} ${y.toFixed(2)}` : ""}Z"/>`;
          break;
        }
        default:
          dots += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cell + 0.3).toFixed(2)}" height="${(cell + 0.3).toFixed(2)}"/>`;
      }
    }
  }

  const eyeColor = d.eyeColor || d.fg;
  const eye = (r: number, c: number) => {
    const x = off + c * cell;
    const y = off + r * cell;
    const o = cell * 7;
    const i = cell * 3;
    if (d.eyeStyle === "circle") {
      return `<circle cx="${x + o / 2}" cy="${y + o / 2}" r="${o / 2 - cell / 2}" fill="none" stroke="${eyeColor}" stroke-width="${cell}"/><circle cx="${x + o / 2}" cy="${y + o / 2}" r="${i / 2 + cell * 0.1}" fill="${eyeColor}"/>`;
    }
    const rxO = d.eyeStyle === "rounded" ? cell * 2 : 0;
    const rxI = d.eyeStyle === "rounded" ? cell * 0.9 : 0;
    return `<rect x="${x + cell / 2}" y="${y + cell / 2}" width="${o - cell}" height="${o - cell}" rx="${rxO}" fill="none" stroke="${eyeColor}" stroke-width="${cell}"/><rect x="${x + cell * 2}" y="${y + cell * 2}" width="${i}" height="${i}" rx="${rxI}" fill="${eyeColor}"/>`;
  };

  let logo = "";
  if (d.logo && logoBox) {
    const n = logoBox.r1 - logoBox.r0 + 1;
    const lx = off + logoBox.r0 * cell;
    const lw = n * cell;
    const pad = cell * 0.6;
    logo = `<rect x="${lx}" y="${lx}" width="${lw}" height="${lw}" rx="${cell}" fill="${d.bg}"/><image href="${esc(d.logo)}" x="${lx + pad}" y="${lx + pad}" width="${lw - pad * 2}" height="${lw - pad * 2}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `<rect width="${px}" height="${px}" fill="${d.bg}"/><g fill="${d.fg}">${dots}</g>${eye(0, 0)}${eye(0, size - 7)}${eye(size - 7, 0)}${logo}`;
}

/**
 * SVG completo con marco. `text` = contenido a codificar.
 */
export function buildQrSvg(text: string, design?: Partial<QrDesign>): string {
  const d: QrDesign = { ...DEFAULT_DESIGN, ...(design || {}) };
  const Q = 400; // tamaño del QR en unidades
  const label = esc((d.frameText || "").slice(0, 28));
  const fc = d.frameColor || "#111827";
  const tc = d.frameTextColor || "#ffffff";
  const font = `font-family="Arial, Helvetica, sans-serif" font-weight="800"`;
  const body = (x: number, y: number) => `<g transform="translate(${x} ${y})">${renderQrBody(text, d, Q)}</g>`;
  const svg = (w: number, h: number, inner: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;

  switch (d.frame) {
    case "bottom": {
      const W = Q + 40, H = Q + 130;
      return svg(W, H, `<rect width="${W}" height="${H}" rx="28" fill="${fc}"/><rect x="14" y="14" width="${Q + 12}" height="${Q + 12}" rx="18" fill="${d.bg}"/>${body(20, 20)}<text x="${W / 2}" y="${Q + 95}" ${font} font-size="44" text-anchor="middle" fill="${tc}">${label}</text>`);
    }
    case "top": {
      const W = Q + 40, H = Q + 130;
      return svg(W, H, `<rect width="${W}" height="${H}" rx="28" fill="${fc}"/><text x="${W / 2}" y="68" ${font} font-size="44" text-anchor="middle" fill="${tc}">${label}</text><rect x="14" y="96" width="${Q + 12}" height="${Q + 12}" rx="18" fill="${d.bg}"/>${body(20, 102)}`);
    }
    case "badge": {
      const W = Q + 40, H = Q + 120;
      return svg(W, H, `<rect x="6" y="6" width="${W - 12}" height="${Q + 28}" rx="26" fill="${d.bg}" stroke="${fc}" stroke-width="12"/>${body(20, 20)}<rect x="${W / 2 - 150}" y="${Q + 42}" width="300" height="66" rx="33" fill="${fc}"/><text x="${W / 2}" y="${Q + 87}" ${font} font-size="34" text-anchor="middle" fill="${tc}">${label}</text>`);
    }
    case "phone": {
      const W = Q + 70, H = Q + 260;
      return svg(W, H, `<rect width="${W}" height="${H}" rx="56" fill="${fc}"/><rect x="${W / 2 - 50}" y="22" width="100" height="16" rx="8" fill="${tc}" opacity=".35"/><rect x="20" y="60" width="${W - 40}" height="${H - 120}" rx="22" fill="${d.bg}"/>${body(35, 90)}<text x="${W / 2}" y="${Q + 160}" ${font} font-size="38" text-anchor="middle" fill="${fc}">${label}</text><circle cx="${W / 2}" cy="${H - 30}" r="14" fill="none" stroke="${tc}" stroke-width="4" opacity=".6"/>`);
    }
    case "clipboard": {
      const W = Q + 60, H = Q + 190;
      return svg(W, H, `<rect y="30" width="${W}" height="${H - 30}" rx="26" fill="${fc}"/><rect x="${W / 2 - 80}" y="0" width="160" height="64" rx="18" fill="${fc}"/><rect x="${W / 2 - 50}" y="14" width="100" height="22" rx="11" fill="${d.bg}" opacity=".9"/><rect x="18" y="78" width="${W - 36}" height="${Q + 24}" rx="14" fill="${d.bg}"/>${body(30, 90)}<text x="${W / 2}" y="${H - 34}" ${font} font-size="40" text-anchor="middle" fill="${tc}">${label}</text>`);
    }
    case "bubble": {
      const W = Q + 40, H = Q + 170;
      return svg(W, H, `<rect width="${W}" height="96" rx="24" fill="${fc}"/><path d="M${W / 2 - 22} 94 L${W / 2} 124 L${W / 2 + 22} 94 Z" fill="${fc}"/><text x="${W / 2}" y="64" ${font} font-size="42" text-anchor="middle" fill="${tc}">${label}</text><rect x="6" y="136" width="${W - 12}" height="${Q + 28}" rx="22" fill="${d.bg}" stroke="${fc}" stroke-width="10"/>${body(20, 150)}`);
    }
    case "circle": {
      const W = Q + 200, H = Q + 200;
      const r = W / 2 - 8;
      const inner = 330; // QR más pequeño para dejar espacio al texto curvo
      const off = (W - inner) / 2 - 20;
      const ar = r - 34;
      const id = "arc" + Math.abs(hash(text)).toString(36);
      return svg(W, H, `<circle cx="${W / 2}" cy="${H / 2}" r="${r}" fill="${d.bg}" stroke="${fc}" stroke-width="14"/><g transform="translate(${(W - inner) / 2} ${off})">${renderQrBody(text, d, inner)}</g><defs><path id="${id}" d="M ${W / 2 - ar} ${H / 2} A ${ar} ${ar} 0 0 0 ${W / 2 + ar} ${H / 2}"/></defs><text ${font} font-size="34" fill="${fc}" letter-spacing="4"><textPath href="#${id}" xlink:href="#${id}" startOffset="50%" text-anchor="middle">${label}</textPath></text>`);
    }
    default:
      return svg(Q, Q, renderQrBody(text, d, Q));
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Convierte un SVG a PNG (data URL) en el navegador. */
export async function svgToPngDataUrl(svg: string, width = 1200): Promise<string> {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const w = vb ? parseFloat(vb[1]) : 400;
  const h = vb ? parseFloat(vb[2]) : 400;
  const scale = width / w;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo rasterizar el QR"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
