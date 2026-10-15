import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRandomCode(prefix = "ZL", length = 6): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // No ambigous 0/O, 1/I
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

export function generatePin(length = 4): string {
  const digits = "0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/**
 * Asegura que una URL tenga el protocolo http:// o https://
 */
export function ensureHttpUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

/**
 * Normaliza enlaces de Instagram.
 * Acepta URLs completas (https://www.instagram.com/usuario), dominios sin esquema (instagram.com/usuario),
 * o handles (@usuario o usuario) y siempre retorna una URL completa https://www.instagram.com/usuario.
 * Limpia parámetros de tracking (?igsh=...) para que quede limpio y compatible.
 */
export function normalizeInstagramUrl(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Extraer username si es una URL de Instagram
  const match = trimmed.match(/(?:instagram\.com\/)([a-zA-Z0-9._]+)/i);
  if (match && match[1]) {
    const user = match[1];
    if (!["p", "reel", "stories", "tv", "explore"].includes(user.toLowerCase())) {
      return `https://www.instagram.com/${user}`;
    }
  }

  // Si ya tiene protocolo pero no encajó en el regex anterior (ej: link especial)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.)?instagram\.com/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const cleanHandle = trimmed.replace(/^@+/, "").replace(/\/+$/, "");
  return `https://www.instagram.com/${cleanHandle}`;
}

/**
 * Extrae el handle de usuario limpio para mostrar visualmente (ej: "@tunegocio")
 * a partir de un handle o de una URL completa (ej: https://www.instagram.com/tunegocio)
 */
export function getInstagramDisplayHandle(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Si contiene instagram.com, extraer el usuario del path
  const match = trimmed.match(/(?:instagram\.com\/)([a-zA-Z0-9._]+)/i);
  if (match && match[1]) {
    const username = match[1];
    if (!["p", "reel", "stories", "tv", "explore"].includes(username.toLowerCase())) {
      return `@${username}`;
    }
  }

  // Si ya es un handle simple o con @
  const clean = trimmed
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\/?/i, "")
    .replace(/^@+/, "")
    .split("/")[0]
    .split("?")[0]
    .trim();

  return clean ? `@${clean}` : trimmed;
}

/**
 * Normaliza enlaces de Facebook a URL completa https://www.facebook.com/...
 */
export function normalizeFacebookUrl(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.|m\.)?(?:facebook\.com|fb\.com)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const clean = trimmed.replace(/^@+/, "").replace(/\/+$/, "");
  return `https://www.facebook.com/${clean}`;
}

/**
 * Normaliza enlaces de TikTok a URL completa https://www.tiktok.com/@usuario
 */
export function normalizeTiktokUrl(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Extraer usuario si contiene tiktok.com/@usuario
  const match = trimmed.match(/(?:tiktok\.com\/@?)([a-zA-Z0-9._]+)/i);
  if (match && match[1]) {
    return `https://www.tiktok.com/@${match[1]}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.)?tiktok\.com/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const clean = trimmed.replace(/^@+/, "").replace(/\/+$/, "");
  return `https://www.tiktok.com/@${clean}`;
}

/**
 * Normaliza enlaces o números de WhatsApp
 */
export function normalizeWhatsAppUrl(numOrUrl?: string | null, defaultMsg?: string | null): string {
  if (!numOrUrl) return "";
  const trimmed = numOrUrl.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:wa\.me|api\.whatsapp\.com|wa\.link)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const cleanDigits = trimmed.replace(/[^0-9]/g, "");
  if (!cleanDigits) return "";
  const msg = defaultMsg || "¡Hola! Vengo desde su placa Zelo.";
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(msg)}`;
}

/**
 * Normaliza cualquier canal según su tipo
 */
export function normalizeChannelValue(type: string, value: string): string {
  const val = (value || "").trim();
  if (!val) return "";

  switch (type) {
    case "instagram":
      return normalizeInstagramUrl(val);
    case "facebook":
      return normalizeFacebookUrl(val);
    case "tiktok":
      return normalizeTiktokUrl(val);
    case "whatsapp":
      if (/^(?:https?:\/\/|wa\.me|api\.whatsapp\.com|wa\.link)/i.test(val)) {
        return normalizeWhatsAppUrl(val);
      }
      return val;
    case "google":
    case "website":
    case "menu":
    case "maps":
    case "custom":
    default:
      return ensureHttpUrl(val);
  }
}

