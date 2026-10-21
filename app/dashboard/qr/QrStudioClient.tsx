"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Link as LinkIcon, AlignLeft, Mail, PhoneCall, MessageSquareText, Contact, MessageCircle, Wifi, FileText,
  Smartphone, Images, PlayCircle, Share2, CalendarDays, Barcode, Star, Download, Save, Trash2, Pencil,
  Pause, Play, Copy, Check, Upload, Loader2, QrCode, ExternalLink, Plus, X,
} from "lucide-react";
import { QR_TYPES, QrType, QrField, getQrTypeDef, buildStaticPayload, buildBarcodeSvg, validateQrData } from "@/lib/qr-types";
import { buildQrSvg, svgToPngDataUrl, DEFAULT_DESIGN, FRAME_OPTIONS, QrDesign, DotStyle, EyeStyle } from "@/lib/qr-render";

const ICONS: Record<string, any> = {
  Link: LinkIcon, AlignLeft, Mail, PhoneCall, MessageSquareText, Contact, MessageCircle, Wifi, FileText,
  Smartphone, Images, PlayCircle, Share2, CalendarDays, Barcode, Star,
};

interface SavedQr {
  id: string;
  code: string;
  name: string;
  type: QrType;
  isDynamic: boolean;
  status: "ACTIVE" | "PAUSED";
  data: Record<string, any>;
  design: QrDesign | null;
  branchId: string | null;
  branchName: string | null;
  scans: number;
  reviews: number;
  createdAt: string;
}

interface Branch { id: string; name: string; managerName: string | null; googleReviewUrl: string | null; businessId: string | null }

function getOrigin(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env.replace(/\/+$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

function encodedContent(type: QrType, isDynamic: boolean, data: Record<string, any>, code: string | null): string {
  const def = getQrTypeDef(type)!;
  if (def.dynamicOnly || isDynamic) return `${getOrigin()}/q/${code || "XXXXXXX"}`;
  return buildStaticPayload(type, data) || " ";
}

function renderSvg(type: QrType, isDynamic: boolean, data: Record<string, any>, design: QrDesign, code: string | null): string {
  if (type === "BARCODE") {
    try {
      return buildBarcodeSvg(data.value || "ZELO", { fg: design.fg, bg: design.bg });
    } catch {
      return buildBarcodeSvg("ZELO");
    }
  }
  return buildQrSvg(encodedContent(type, isDynamic, data, code), design);
}

function fitSvg(svg: string): string {
  return svg.replace(/<svg([^>]*?) width="[\d.]+" height="[\d.]+"/, '<svg$1 width="100%" height="100%" style="display:block"');
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function QrStudioClient() {
  const [type, setType] = useState<QrType>("LINK");
  const [data, setData] = useState<Record<string, any>>({});
  const [name, setName] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const [design, setDesign] = useState<QrDesign>({ ...DEFAULT_DESIGN });
  const [tab, setTab] = useState<"marco" | "forma" | "logo">("marco");
  const [editing, setEditing] = useState<SavedQr | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [list, setList] = useState<SavedQr[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const def = getQrTypeDef(type)!;
  const effectiveDynamic = def.dynamicOnly || (def.supportsStatic && isDynamic && type !== "BARCODE");

  const loadAll = async () => {
    const [q, b] = await Promise.all([fetch("/api/qr-codes", { cache: "no-store" }), fetch("/api/branches", { cache: "no-store" })]);
    const qj = await q.json();
    const bj = await b.json();
    if (q.ok) setList(qj.qrCodes);
    if (b.ok) setBranches(bj.branches);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const svg = useMemo(() => {
    try {
      return renderSvg(type, effectiveDynamic, data, design, savedCode);
    } catch {
      return "";
    }
  }, [type, effectiveDynamic, data, design, savedCode]);

  const resetForm = (t: QrType = type) => {
    setEditing(null);
    setSavedCode(null);
    setType(t);
    setData(t === "REVIEW_FILTER" ? { threshold: "3", question: "¿Cómo calificarías tu visita, del 1 al 5?" } : t === "WIFI" ? { encryption: "WPA" } : {});
    setName("");
    setError(null);
    setNotice(null);
  };

  const selectType = (t: QrType) => {
    if (t === type && !editing) return;
    resetForm(t);
    if (t === "REVIEW_FILTER") setDesign((d) => ({ ...d, frame: d.frame === "none" ? "bottom" : d.frame, frameText: d.frameText === "SCAN ME" ? "¡CALIFÍCANOS!" : d.frameText }));
  };

  const setField = (k: string, v: any) => {
    setData((d) => {
      const nd = { ...d, [k]: v };
      if (type === "REVIEW_FILTER" && k === "branchId") {
        const b = branches.find((x) => x.id === v);
        if (b && !d.googleReviewUrl && b.googleReviewUrl) nd.googleReviewUrl = b.googleReviewUrl;
      }
      return nd;
    });
    if (!editing) setSavedCode(null);
  };

  const uploadFiles = async (field: QrField, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(field.key);
    setError(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("file", f));
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al subir");
      const urls: string[] = json.files.map((f: any) => f.url);
      if (field.kind === "files") {
        const prev: string[] = Array.isArray(data[field.key]) ? data[field.key] : String(data[field.key] || "").split(/\n+/).filter(Boolean);
        setField(field.key, [...prev, ...urls]);
      } else {
        setField(field.key, urls[0]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(null);
    }
  };

  const save = async (): Promise<SavedQr | null> => {
    setError(null);
    setNotice(null);
    const payloadData = { ...data };
    if (def.fields.some((f) => f.kind === "files")) {
      for (const f of def.fields.filter((f) => f.kind === "files")) {
        const v = payloadData[f.key];
        payloadData[f.key] = Array.isArray(v) ? v : String(v || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
      }
    }
    const err = validateQrData(type, payloadData);
    if (err) {
      setError(err);
      return null;
    }
    setSaving(true);
    try {
      const body = { type, name: name || undefined, isDynamic: effectiveDynamic, data: payloadData, design };
      const res = await fetch(editing ? `/api/qr-codes/${editing.id}` : "/api/qr-codes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo guardar");
      await loadAll();
      const saved: SavedQr = editing ? { ...editing, type, data: payloadData, design, isDynamic: effectiveDynamic, name: name || editing.name } : json.qrCode;
      setEditing(saved);
      setSavedCode(saved.code);
      setName(saved.name);
      setNotice(editing ? "Cambios guardados. Si es dinámico, el QR impreso ya apunta al nuevo contenido." : "QR creado y guardado.");
      return saved;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const doDownload = async (fmt: "png" | "svg") => {
    // Siempre guardar antes de descargar, así lo impreso coincide con lo registrado
    const s = await save();
    if (!s) return;
    const code = s.code;
    const finalName = s.name;
    const finalSvg = renderSvg(type, effectiveDynamic, data, design, code);
    const fname = (finalName || "qr").replace(/[^\w\-]+/g, "_");
    if (fmt === "svg") {
      download(URL.createObjectURL(new Blob([finalSvg], { type: "image/svg+xml" })), `${fname}.svg`);
    } else {
      download(await svgToPngDataUrl(finalSvg, 1400), `${fname}.png`);
    }
  };

  const edit = (q: SavedQr) => {
    setEditing(q);
    setSavedCode(q.code);
    setType(q.type);
    setData(q.data || {});
    setName(q.name);
    setIsDynamic(q.isDynamic);
    setDesign({ ...DEFAULT_DESIGN, ...(q.design || {}) });
    setError(null);
    setNotice(null);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const remove = async (q: SavedQr) => {
    if (!confirm(`¿Eliminar el QR "${q.name}"? Los impresos dejarán de funcionar.`)) return;
    await fetch(`/api/qr-codes/${q.id}`, { method: "DELETE" });
    if (editing?.id === q.id) resetForm();
    loadAll();
  };

  const toggle = async (q: SavedQr) => {
    await fetch(`/api/qr-codes/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: q.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }) });
    loadAll();
  };

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      setCopied(t);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const onLogo = (file: File | null) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setError("El logo debe pesar menos de 1.5 MB");
      return;
    }
    const r = new FileReader();
    r.onload = () => setDesign((d) => ({ ...d, logo: String(r.result) }));
    r.readAsDataURL(file);
  };

  const input = "w-full rounded-xl bg-slate-950/70 border border-slate-700 focus:border-indigo-500 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500";

  const renderField = (f: QrField) => {
    const v = data[f.key];
    switch (f.kind) {
      case "textarea":
        return <textarea rows={3} value={v || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} className={input} />;
      case "select":
        return (
          <select value={v || f.options?.[0]?.value || ""} onChange={(e) => setField(f.key, e.target.value)} className={input}>
            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case "checkbox":
        return (
          <label className="flex items-center gap-2 text-sm text-slate-300 h-[42px]">
            <input type="checkbox" checked={!!v} onChange={(e) => setField(f.key, e.target.checked)} className="w-4 h-4 accent-indigo-500" /> Sí
          </label>
        );
      case "datetime":
        return <input type="datetime-local" value={v || ""} onChange={(e) => setField(f.key, e.target.value)} className={input} />;
      case "branch":
        return (
          <div className="flex gap-2">
            <select value={v || ""} onChange={(e) => setField(f.key, e.target.value)} className={input}>
              <option value="">— Selecciona una sucursal —</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.managerName ? ` · gerente: ${b.managerName}` : " · ⚠ sin gerente"}</option>)}
            </select>
            <Link href="/dashboard/gerentes" className="shrink-0 px-3 rounded-xl border border-slate-700 text-xs text-slate-300 flex items-center gap-1 hover:bg-slate-800">
              <Plus className="w-3.5 h-3.5" /> Sucursal
            </Link>
          </div>
        );
      case "file":
      case "files": {
        const many = f.kind === "files";
        const list: string[] = many ? (Array.isArray(v) ? v : String(v || "").split(/\n+/).filter(Boolean)) : [];
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              {many ? (
                <textarea rows={2} value={list.join("\n")} onChange={(e) => setField(f.key, e.target.value.split("\n"))} placeholder="https://… (uno por línea)" className={input} />
              ) : (
                <input value={v || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder="https://…" className={input} />
              )}
              <label className="shrink-0 cursor-pointer px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5">
                {uploading === f.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Subir
                <input type="file" accept={f.accept} multiple={many} className="hidden" onChange={(e) => { uploadFiles(f, e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            {many && list.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {list.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-14 h-14 object-cover rounded-lg border border-slate-700" />
                    <button onClick={() => setField(f.key, list.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      default:
        return <input type={f.kind === "url" ? "url" : f.kind === "tel" ? "tel" : f.kind === "email" ? "email" : f.kind === "number" ? "number" : "text"} value={v || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} className={input} />;
    }
  };

  const swatch = (key: keyof QrDesign, label: string) => (
    <label className="flex items-center gap-2 text-xs text-slate-300">
      <input type="color" value={(design[key] as string) || "#000000"} onChange={(e) => setDesign((d) => ({ ...d, [key]: e.target.value }))} className="w-9 h-9 rounded-lg bg-transparent border border-slate-700 cursor-pointer" />
      {label}
    </label>
  );

  const frameThumb = (frame: string) =>
    buildQrSvg("ZELO", { ...DEFAULT_DESIGN, frame: frame as any, frameText: "SCAN ME", frameColor: "#111827" });

  return (
    <div className="space-y-8" ref={topRef}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><QrCode className="w-6 h-6 text-indigo-400" /> Generador de QR y redirecciones</h1>
          <p className="text-sm text-slate-400">Elige el tipo, completa el contenido, diseña y descarga. Los QR dinámicos se pueden editar sin reimprimir.</p>
        </div>
        {editing && (
          <button onClick={() => resetForm("LINK")} className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo QR
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
        {/* IZQUIERDA */}
        <div className="p-5 sm:p-6 space-y-7 border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Menú de tipos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-2 p-2 rounded-2xl border border-slate-800 bg-slate-950/40">
            {QR_TYPES.map((t) => {
              const Icon = ICONS[t.icon] || LinkIcon;
              const active = t.type === type;
              const special = t.type === "REVIEW_FILTER";
              return (
                <button
                  key={t.type}
                  onClick={() => selectType(t.type)}
                  title={t.description}
                  className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl text-sm font-medium transition border ${
                    active
                      ? special ? "bg-amber-500/15 border-amber-400/60 text-amber-300" : "bg-emerald-500/10 border-emerald-400/60 text-emerald-300"
                      : special ? "border-amber-500/30 text-amber-300/90 hover:bg-amber-500/10" : "border-transparent text-slate-300 hover:bg-slate-800/70"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          {type === "REVIEW_FILTER" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90 space-y-1">
              <div className="font-bold text-amber-300">C-03 · Filtro inteligente de reseñas</div>
              <div>El cliente califica del 1 al 5. Si la nota supera el umbral, se registra y se le lleva a dejar su reseña en Google. Si es baja, no se ofrece Google: se pregunta “¿qué podemos mejorar?” y se avisa en privado al gerente de la sucursal (WhatsApp/correo) con sucursal y hora, abriendo un chat para resolverlo.</div>
            </div>
          )}

          {/* Paso 1 */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-white font-semibold"><span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">1</span> Completa el contenido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre interno del QR</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Ej. ${type === "REVIEW_FILTER" ? "Mesa 4 – Sucursal Centro" : def.label + " principal"}`} className={input} />
              </div>
              {def.fields.map((f) => (
                <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">{f.label}{f.required && <span className="text-rose-400"> *</span>}</label>
                  {renderField(f)}
                  {f.help && <p className="text-[11px] text-slate-500 mt-1">{f.help}</p>}
                </div>
              ))}
              {type === "REVIEW_FILTER" && (
                <label className="sm:col-span-2 flex items-start gap-2 text-xs text-slate-400">
                  <input type="checkbox" checked={!!data.alwaysOfferGoogle} onChange={(e) => setField("alwaysOfferGoogle", e.target.checked)} className="mt-0.5 accent-indigo-500" />
                  <span>Mostrar también un enlace discreto a Google a quien calificó bajo (recomendado para cumplir las políticas de reseñas de Google, que no permiten pedir reseñas solo a clientes satisfechos).</span>
                </label>
              )}
              {def.supportsStatic && type !== "BARCODE" && (
                <label className="sm:col-span-2 flex items-start gap-2 text-xs text-slate-400">
                  <input type="checkbox" checked={isDynamic} onChange={(e) => { setIsDynamic(e.target.checked); setSavedCode(editing?.code || null); }} className="mt-0.5 accent-indigo-500" />
                  <span><b className="text-slate-200">QR dinámico</b> (recomendado): pasa por ZELO, cuenta escaneos y puedes cambiar el destino sin reimprimir. Desactívalo para codificar el contenido directo en el QR.</span>
                </label>
              )}
            </div>
          </section>

          <div className="border-t border-slate-800" />

          {/* Paso 2 */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-white font-semibold"><span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">2</span> Diseña tu código {type === "BARCODE" ? "de barras" : "QR"}</h2>
            {type === "BARCODE" ? (
              <div className="flex gap-6">{swatch("fg", "Barras")}{swatch("bg", "Fondo")}</div>
            ) : (
              <div className="rounded-2xl border border-slate-800">
                <div className="flex border-b border-slate-800">
                  {(["marco", "forma", "logo"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm capitalize ${tab === t ? "text-emerald-300 border-b-2 border-emerald-400 bg-slate-950/40" : "text-slate-400 hover:text-white"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="p-4 space-y-4">
                  {tab === "marco" && (
                    <>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {FRAME_OPTIONS.map((f) => (
                          <button key={f.value} onClick={() => setDesign((d) => ({ ...d, frame: f.value }))} title={f.label}
                            className={`shrink-0 w-[78px] h-[78px] rounded-xl border-2 p-1.5 bg-white flex items-center justify-center ${design.frame === f.value ? "border-indigo-500 ring-2 ring-indigo-500/40" : "border-slate-700"}`}>
                            {f.value === "none" ? <X className="w-7 h-7 text-slate-800" /> : <span className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: fitSvg(frameThumb(f.value)) }} />}
                          </button>
                        ))}
                      </div>
                      {design.frame !== "none" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Texto del marco</label>
                            <input value={design.frameText} maxLength={28} onChange={(e) => setDesign((d) => ({ ...d, frameText: e.target.value }))} className={input} />
                          </div>
                          {swatch("frameColor", "Color del marco")}
                          {swatch("frameTextColor", "Color del texto")}
                        </div>
                      )}
                    </>
                  )}
                  {tab === "forma" && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-2">Forma de los puntos</div>
                        <div className="flex flex-wrap gap-2">
                          {(["square", "rounded", "dots", "classy"] as DotStyle[]).map((s) => (
                            <button key={s} onClick={() => setDesign((d) => ({ ...d, dotStyle: s }))} className={`px-3 py-2 rounded-lg text-xs border ${design.dotStyle === s ? "border-indigo-500 bg-indigo-500/15 text-indigo-200" : "border-slate-700 text-slate-300"}`}>
                              {{ square: "Cuadrados", rounded: "Redondeados", dots: "Puntos", classy: "Elegante" }[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-2">Forma de las esquinas (ojos)</div>
                        <div className="flex flex-wrap gap-2">
                          {(["square", "rounded", "circle"] as EyeStyle[]).map((s) => (
                            <button key={s} onClick={() => setDesign((d) => ({ ...d, eyeStyle: s }))} className={`px-3 py-2 rounded-lg text-xs border ${design.eyeStyle === s ? "border-indigo-500 bg-indigo-500/15 text-indigo-200" : "border-slate-700 text-slate-300"}`}>
                              {{ square: "Cuadradas", rounded: "Redondeadas", circle: "Circulares" }[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-6">{swatch("fg", "Color QR")}{swatch("eyeColor", "Color esquinas")}{swatch("bg", "Fondo")}</div>
                      <p className="text-[11px] text-slate-500">Consejo: usa colores oscuros sobre fondo claro para que todos los teléfonos lo lean.</p>
                    </div>
                  )}
                  {tab === "logo" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {design.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={design.logo} alt="logo" className="w-16 h-16 object-contain rounded-xl bg-white p-1" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-slate-600 flex items-center justify-center text-slate-500 text-xs">Sin logo</div>
                        )}
                        <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Subir logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] || null)} />
                        </label>
                        {design.logo && <button onClick={() => setDesign((d) => ({ ...d, logo: null }))} className="text-xs text-rose-400 hover:underline">Quitar</button>}
                      </div>
                      <label className="block text-xs text-slate-400">
                        Tamaño del logo
                        <input type="range" min={0.14} max={0.3} step={0.01} value={design.logoSize || 0.22} onChange={(e) => setDesign((d) => ({ ...d, logoSize: parseFloat(e.target.value) }))} className="w-full accent-indigo-500" />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* DERECHA: vista previa y descarga */}
        <div className="p-5 sm:p-6 bg-slate-950/40 flex flex-col items-center gap-4">
          <h2 className="flex items-center gap-2 text-white font-semibold self-start"><span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">3</span> Descargar código {type === "BARCODE" ? "" : "QR"}</h2>
          <div className="w-full aspect-square max-w-[320px] rounded-2xl bg-white p-4 flex items-center justify-center shadow-inner">
            {svg ? <div className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: fitSvg(svg) }} /> : <span className="text-slate-400 text-sm">Completa el contenido</span>}
          </div>
          <div className="w-full text-[11px] text-slate-400 text-center break-all min-h-[16px]">
            {type === "BARCODE" ? "Code-128" : effectiveDynamic ? (savedCode ? `${getOrigin()}/q/${savedCode}` : "Se generará un enlace corto al guardar") : "Contenido estático codificado en el QR"}
          </div>
          {error && <div className="w-full text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</div>}
          {notice && <div className="w-full text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">{notice}</div>}
          <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editing ? "Guardar cambios" : "Guardar QR"}
          </button>
          <div className="w-full grid grid-cols-2 gap-2">
            <button onClick={() => doDownload("png")} disabled={saving} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Download className="w-4 h-4" /> PNG
            </button>
            <button onClick={() => doDownload("svg")} disabled={saving} className="py-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Download className="w-4 h-4" /> SVG
            </button>
          </div>
          {savedCode && effectiveDynamic && (
            <a href={`/q/${savedCode}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300 hover:underline flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Probar como cliente
            </a>
          )}
        </div>
      </div>

      {/* LISTADO */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">Mis códigos ({list.length})</div>
        {list.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Aún no has creado códigos.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {list.map((q) => {
              const d = getQrTypeDef(q.type);
              const Icon = ICONS[d?.icon || "Link"] || LinkIcon;
              const url = `${getOrigin()}/q/${q.code}`;
              return (
                <div key={q.id} className={`flex flex-wrap items-center gap-4 px-5 py-3.5 ${editing?.id === q.id ? "bg-indigo-500/5" : ""}`}>
                  <div className="w-14 h-14 rounded-lg bg-white p-1 shrink-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: (() => { try { return fitSvg(renderSvg(q.type, q.isDynamic, q.data, { ...DEFAULT_DESIGN, ...(q.design || {}), frame: "none", logo: null }, q.code)); } catch { return ""; } })() }} />
                  <div className="flex-1 min-w-[180px]">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${q.type === "REVIEW_FILTER" ? "text-amber-400" : "text-indigo-400"}`} /> {q.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                      <span>{d?.label}</span>
                      <span className="font-mono">{q.code}</span>
                      {q.branchName && <span>Sucursal: {q.branchName}</span>}
                      <span>{q.isDynamic ? "Dinámico" : "Estático"}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 text-center w-20">
                    <div className="text-lg font-bold text-white">{q.isDynamic ? q.scans : "—"}</div>escaneos
                  </div>
                  {q.type === "REVIEW_FILTER" && (
                    <div className="text-xs text-slate-300 text-center w-20">
                      <div className="text-lg font-bold text-amber-300">{q.reviews}</div>calificaciones
                    </div>
                  )}
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${q.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>{q.status === "ACTIVE" ? "Activo" : "Pausado"}</span>
                  <div className="flex items-center gap-1">
                    {q.isDynamic && (
                      <>
                        <button title="Copiar enlace" onClick={() => copy(url)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">{copied === url ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button>
                        <a title="Abrir" href={`/q/${q.code}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><ExternalLink className="w-4 h-4" /></a>
                      </>
                    )}
                    <button title={q.status === "ACTIVE" ? "Pausar" : "Activar"} onClick={() => toggle(q)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">{q.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                    <button title="Editar / descargar" onClick={() => edit(q)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                    <button title="Eliminar" onClick={() => remove(q)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
