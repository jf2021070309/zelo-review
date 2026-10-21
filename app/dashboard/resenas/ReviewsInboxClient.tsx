"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Star, ShieldCheck, RefreshCw, Bell, ExternalLink, MessageSquare, Loader2 } from "lucide-react";
import CaseChat from "@/components/review/CaseChat";
import { StarsInline } from "@/components/review/StarRating";

const CASE_STATUS: Record<string, { t: string; c: string }> = {
  OPEN: { t: "Nuevo", c: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  IN_PROGRESS: { t: "En conversación", c: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  RESOLVED: { t: "Resuelto", c: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  RECOVERED: { t: "Recuperado", c: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  CLOSED: { t: "Cerrado", c: "bg-slate-700/50 text-slate-300 border-slate-600" },
};
const REVIEW_STATUS: Record<string, { t: string; c: string }> = {
  PUBLISHED: { t: "Pública → Google", c: "text-emerald-700" },
  INTERCEPTED: { t: "Privada (gerente)", c: "text-rose-700" },
  RECOVERED: { t: "Recuperada → Google", c: "text-sky-700" },
};

function ago(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export default function ReviewsInboxClient() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"casos" | "resenas" | "avisos">("casos");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [running, setRunning] = useState(false);
  const [cronMsg, setCronMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/review-inbox", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const runCron = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/follow-ups", { method: "POST" });
      const j = await res.json();
      setCronMsg(res.ok ? `Recordatorios enviados: ${j.reminders} · Seguimientos: ${j.followUps}` : j.error);
      load();
    } finally {
      setRunning(false);
    }
  };

  if (!data) return <div className="p-10 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>;

  const s = data.stats;
  const cases = (data.cases as any[]).filter((c) => filter === "ALL" || ["OPEN", "IN_PROGRESS"].includes(c.status));
  const sel = data.cases.find((c: any) => c.id === selected) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Inbox className="w-6 h-6 text-amber-400" /> Filtro de reseñas · Bandeja</h1>
          <p className="text-sm text-slate-400">Las calificaciones bajas llegan aquí (y al gerente) antes de hacerse públicas. Conversa, resuelve e invita a re-calificar.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/qr" className="px-3.5 py-2 rounded-xl border border-slate-700 text-xs text-slate-200 hover:bg-slate-800">Crear QR de reseñas</Link>
          <button onClick={runCron} disabled={running} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white flex items-center gap-1.5 disabled:opacity-60">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Procesar recordatorios
          </button>
        </div>
      </div>
      {cronMsg && <div className="text-xs text-slate-300">{cronMsg}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { t: "Calificaciones", v: s.total, c: "text-white" },
          { t: "Públicas (4–5★)", v: s.published, c: "text-emerald-300" },
          { t: "Interceptadas", v: s.intercepted, c: "text-rose-300" },
          { t: "Recuperadas", v: s.recovered, c: "text-sky-300" },
          { t: "Promedio público vs real", v: `${s.publicAvg ?? "—"} / ${s.rawAvg ?? "—"}`, c: "text-amber-300" },
        ].map((k) => (
          <div key={k.t} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">{k.t}</div>
            <div className={`text-2xl font-black mt-1 ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-slate-800">
        {[
          { k: "casos", t: `Casos privados (${data.cases.filter((c: any) => ["OPEN", "IN_PROGRESS"].includes(c.status)).length} abiertos)`, I: ShieldCheck },
          { k: "resenas", t: "Reseñas registradas", I: Star },
          { k: "avisos", t: "Avisos enviados", I: Bell },
        ].map(({ k, t, I }) => (
          <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-2.5 text-sm flex items-center gap-2 ${tab === k ? "text-white border-b-2 border-amber-400" : "text-slate-400 hover:text-white"}`}>
            <I className="w-4 h-4" /> {t}
          </button>
        ))}
      </div>

      {tab === "casos" && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex gap-2 p-3 border-b border-slate-800">
              <button onClick={() => setFilter("ACTIVE")} className={`px-3 py-1 rounded-lg text-xs ${filter === "ACTIVE" ? "bg-slate-700 text-white" : "text-slate-400"}`}>Abiertos</button>
              <button onClick={() => setFilter("ALL")} className={`px-3 py-1 rounded-lg text-xs ${filter === "ALL" ? "bg-slate-700 text-white" : "text-slate-400"}`}>Todos</button>
            </div>
            {cases.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No hay casos {filter === "ACTIVE" ? "abiertos" : ""}. 🎉</div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[70vh] overflow-y-auto">
                {cases.map((c: any) => {
                  const st = CASE_STATUS[c.status];
                  return (
                    <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left px-4 py-3 hover:bg-slate-800/40 ${selected === c.id ? "bg-slate-800/60" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white truncate">{c.customerName || "Cliente"}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">{ago(c.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarsInline value={c.rating} size={12} emptyColor="#475569" />
                        {c.newRating && c.newRating !== c.originalRating && <span className="text-[10px] text-slate-400">(antes {c.originalRating}★)</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${st.c}`}>{st.t}</span>
                        {c.lastSender === "CUSTOMER" && ["OPEN", "IN_PROGRESS"].includes(c.status) && <span className="text-[10px] text-amber-300">● espera respuesta</span>}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-1">{c.feedback || "(sin comentario)"}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{c.branchName || "Sin sucursal"} · {c.managerName ? `Gerente: ${c.managerName}` : "⚠ sin gerente"} · {c.messageCount} msj</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="min-h-[60vh]">
            {sel ? (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <a href={`/atencion/${sel.managerToken}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300 hover:underline flex items-center gap-1">Abrir enlace del gerente <ExternalLink className="w-3 h-3" /></a>
                </div>
                <CaseChat key={sel.managerToken} token={sel.managerToken} />
              </div>
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-sm gap-2 p-10">
                <MessageSquare className="w-8 h-8" /> Selecciona un caso para conversar con el cliente
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "resenas" && (
        <div className="rounded-2xl bg-white text-[#202124] overflow-hidden" style={{ fontFamily: "Roboto, Arial, sans-serif" }}>
          <div className="px-6 py-4 border-b border-[#e8eaed] flex flex-wrap items-center gap-4">
            <div className="text-4xl">{s.publicAvg ?? "—"}</div>
            <div>
              <StarsInline value={Math.round(s.publicAvg || 0)} size={18} />
              <div className="text-xs text-[#5f6368]">{s.published + s.recovered} reseñas públicas · promedio sin filtro: {s.rawAvg ?? "—"}</div>
            </div>
          </div>
          {data.reviews.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5f6368]">Aún no hay calificaciones.</div>
          ) : (
            <ul className="divide-y divide-[#e8eaed]">
              {data.reviews.map((r: any) => (
                <li key={r.id} className="px-6 py-4 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#7b1fa2] text-white flex items-center justify-center shrink-0">{(r.authorName || "C").slice(0, 1).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3">
                      <span className="font-medium">{r.authorName}</span>
                      <span className={`text-xs font-semibold ${REVIEW_STATUS[r.status]?.c}`}>{REVIEW_STATUS[r.status]?.t}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#5f6368]">
                      <StarsInline value={r.rating} size={13} />
                      {r.originalRating !== r.rating && <span>(calificó {r.originalRating}★ al inicio)</span>}
                      <span>{ago(r.createdAt)}</span>
                      <span>· {r.branchName || "—"} · {r.qrName}</span>
                    </div>
                    {r.comment && <p className="text-sm mt-1 whitespace-pre-wrap">{r.comment}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "avisos" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-950/60">
              <tr><th className="text-left px-4 py-2.5">Fecha</th><th className="text-left px-4 py-2.5">Para</th><th className="text-left px-4 py-2.5">Canal</th><th className="text-left px-4 py-2.5">Asunto</th><th className="text-left px-4 py-2.5">Estado</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.notifications.map((n: any) => (
                <tr key={n.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap">{new Date(n.createdAt).toLocaleString("es-PE")}</td>
                  <td className="px-4 py-2.5">{n.audience === "MANAGER" ? "Gerente" : "Cliente"} · {n.recipient}</td>
                  <td className="px-4 py-2.5">{n.channel}</td>
                  <td className="px-4 py-2.5">{n.subject}</td>
                  <td className={`px-4 py-2.5 ${n.status === "SENT" ? "text-emerald-300" : n.status === "FAILED" ? "text-rose-300" : "text-amber-300"}`} title={n.error || ""}>{n.status === "SIMULATED" ? "Simulado" : n.status}</td>
                  <td className="px-4 py-2.5">{n.deliveryUrl && n.status !== "SENT" && <a href={n.deliveryUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:underline">Enviar a mano</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.notifications.length === 0 && <div className="p-8 text-center text-sm text-slate-400">Sin avisos todavía.</div>}
        </div>
      )}
    </div>
  );
}
