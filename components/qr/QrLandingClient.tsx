"use client";

import { useEffect, useState } from "react";
import { buildMailto, buildWhatsAppUrl, withHttp, buildBarcodeSvg } from "@/lib/qr-types";

interface Props {
  code: string;
  type: string;
  name: string;
  data: Record<string, any>;
  accent: string;
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

function Btn({ href, children, accent, download }: { href: string; children: React.ReactNode; accent: string; download?: boolean }) {
  return (
    <a
      href={href}
      download={download}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="block w-full text-center py-3.5 rounded-xl font-semibold text-white shadow-md active:scale-[.98] transition"
      style={{ background: accent }}
    >
      {children}
    </a>
  );
}

export default function QrLandingClient({ code, type, name, data, accent }: Props) {
  const [copied, setCopied] = useState(false);

  // Acciones con esquemas no-http: abrir automáticamente
  const autoHref =
    type === "EMAIL" ? buildMailto(data.to, data.subject, data.body) :
    type === "CALL" ? `tel:${String(data.phone || "").replace(/[^0-9+]/g, "")}` :
    type === "SMS" ? `sms:${String(data.phone || "").replace(/[^0-9+]/g, "")}${data.message ? `?&body=${encodeURIComponent(data.message)}` : ""}` :
    null;

  useEffect(() => {
    if (autoHref) {
      const t = setTimeout(() => (window.location.href = autoHref), 400);
      return () => clearTimeout(t);
    }
  }, [autoHref]);

  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  let title = data.title || name;
  let body: React.ReactNode = null;

  switch (type) {
    case "TEXT":
      title = name;
      body = (
        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-slate-800">{data.text}</p>
          <button onClick={() => copy(data.text || "")} className="w-full py-3 rounded-xl border border-slate-300 font-semibold">
            {copied ? "✓ Copiado" : "Copiar texto"}
          </button>
        </div>
      );
      break;
    case "EMAIL":
    case "CALL":
    case "SMS":
      title = type === "EMAIL" ? "Enviar correo" : type === "CALL" ? "Llamar" : "Enviar SMS";
      body = (
        <div className="space-y-3 text-center">
          <p className="text-slate-600">{type === "EMAIL" ? data.to : data.phone}</p>
          <Btn href={autoHref!} accent={accent}>{type === "EMAIL" ? "Abrir correo" : type === "CALL" ? "Llamar ahora" : "Abrir SMS"}</Btn>
        </div>
      );
      break;
    case "VCARD": {
      const full = [data.firstName, data.lastName].filter(Boolean).join(" ");
      title = full;
      body = (
        <div className="space-y-4">
          <div className="text-center text-slate-600">{[data.title, data.org].filter(Boolean).join(" · ")}</div>
          <ul className="divide-y divide-slate-100 text-[15px]">
            {data.phone && <li className="py-2.5"><a href={`tel:${data.phone}`}>📞 {data.phone}</a></li>}
            {data.mobile && <li className="py-2.5"><a href={`tel:${data.mobile}`}>📱 {data.mobile}</a></li>}
            {data.email && <li className="py-2.5"><a href={`mailto:${data.email}`}>✉️ {data.email}</a></li>}
            {data.website && <li className="py-2.5"><a href={withHttp(data.website)} target="_blank" rel="noopener noreferrer">🌐 {data.website}</a></li>}
            {data.address && <li className="py-2.5">📍 {data.address}</li>}
            {data.note && <li className="py-2.5 text-slate-600 whitespace-pre-wrap">{data.note}</li>}
          </ul>
          <Btn href={`/api/public/qr-file/${code}`} accent={accent} download>Guardar contacto</Btn>
        </div>
      );
      break;
    }
    case "WIFI":
      title = "Red Wi-Fi";
      body = (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 space-y-2">
            <div className="text-xs uppercase text-slate-500">Red</div>
            <div className="text-lg font-semibold">{data.ssid}</div>
            {data.encryption !== "nopass" && (
              <>
                <div className="text-xs uppercase text-slate-500 pt-2">Contraseña</div>
                <div className="text-lg font-mono break-all">{data.password}</div>
              </>
            )}
          </div>
          {data.encryption !== "nopass" && (
            <button onClick={() => copy(data.password || "")} className="w-full py-3.5 rounded-xl font-semibold text-white" style={{ background: accent }}>
              {copied ? "✓ Contraseña copiada" : "Copiar contraseña"}
            </button>
          )}
          <p className="text-xs text-slate-500 text-center">Abre los ajustes de Wi-Fi de tu teléfono, elige la red y pega la contraseña.</p>
        </div>
      );
      break;
    case "PDF":
      body = (
        <div className="space-y-4">
          {data.description && <p className="text-slate-600 whitespace-pre-wrap">{data.description}</p>}
          <iframe src={data.fileUrl} className="w-full h-[60vh] rounded-xl border border-slate-200 bg-slate-50" title={title} />
          <Btn href={data.fileUrl} accent={accent}>Abrir / descargar PDF</Btn>
        </div>
      );
      break;
    case "IMAGES": {
      const imgs: string[] = Array.isArray(data.images) ? data.images : String(data.images || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
      body = (
        <div className="space-y-4">
          {data.description && <p className="text-slate-600 whitespace-pre-wrap">{data.description}</p>}
          <div className="grid grid-cols-2 gap-2">
            {imgs.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" className={i === 0 && imgs.length % 2 === 1 ? "col-span-2" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover rounded-xl aspect-square bg-slate-100" />
              </a>
            ))}
          </div>
        </div>
      );
      break;
    }
    case "VIDEO": {
      const url = String(data.videoUrl || "");
      const embed = youtubeEmbed(url);
      body = (
        <div className="space-y-4">
          {embed ? (
            <iframe src={embed} className="w-full aspect-video rounded-xl" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={title} />
          ) : (
            <video src={url} controls playsInline className="w-full rounded-xl bg-black" />
          )}
          {data.description && <p className="text-slate-600 whitespace-pre-wrap">{data.description}</p>}
        </div>
      );
      break;
    }
    case "SOCIAL": {
      const links: [string, string, string][] = [
        ["facebook", "Facebook", "#1877F2"],
        ["instagram", "Instagram", "#E1306C"],
        ["tiktok", "TikTok", "#111111"],
        ["youtube", "YouTube", "#FF0000"],
        ["x", "X / Twitter", "#111111"],
        ["linkedin", "LinkedIn", "#0A66C2"],
        ["website", "Sitio web", accent],
      ];
      body = (
        <div className="space-y-3">
          {data.description && <p className="text-slate-600 text-center whitespace-pre-wrap">{data.description}</p>}
          {data.whatsapp && <Btn href={buildWhatsAppUrl(data.whatsapp)} accent="#25D366">WhatsApp</Btn>}
          {links.filter(([k]) => data[k]).map(([k, label, color]) => (
            <Btn key={k} href={withHttp(data[k])} accent={color}>{label}</Btn>
          ))}
        </div>
      );
      break;
    }
    case "EVENT": {
      const fmt = (v?: string) => (v ? new Date(v).toLocaleString("es-PE", { dateStyle: "full", timeStyle: "short" }) : "");
      body = (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 space-y-1 text-[15px]">
            <div>🗓️ {fmt(data.start)}{data.end ? ` — ${fmt(data.end)}` : ""}</div>
            {data.location && <div>📍 {data.location}</div>}
          </div>
          {data.description && <p className="text-slate-600 whitespace-pre-wrap">{data.description}</p>}
          <Btn href={`/api/public/qr-file/${code}`} accent={accent} download>Agregar al calendario</Btn>
        </div>
      );
      break;
    }
    case "APP":
      title = data.appName || name;
      body = (
        <div className="space-y-3">
          {data.iosUrl && <Btn href={withHttp(data.iosUrl)} accent="#111111">Descargar en App Store</Btn>}
          {data.androidUrl && <Btn href={withHttp(data.androidUrl)} accent="#01875f">Descargar en Google Play</Btn>}
          {data.fallbackUrl && <Btn href={withHttp(data.fallbackUrl)} accent={accent}>Ir al sitio</Btn>}
        </div>
      );
      break;
    case "BARCODE":
      body = <div className="bg-white rounded-xl p-2" dangerouslySetInnerHTML={{ __html: buildBarcodeSvg(data.value || "").replace(/width="[\d.]+" height="[\d.]+"/, 'width="100%"') }} />;
      break;
    default:
      body = <p className="text-slate-600">Contenido no disponible.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white text-slate-900 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="h-2 rounded-full mb-6" style={{ background: accent }} />
        <h1 className="text-2xl font-bold text-center mb-6 break-words">{title}</h1>
        <div className="bg-white rounded-2xl shadow-lg p-5">{body}</div>
        <div className="text-center text-[11px] text-slate-400 mt-6">Con tecnología de ZELO</div>
      </div>
    </div>
  );
}
