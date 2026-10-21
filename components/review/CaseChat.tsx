"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StarRating, { StarsInline } from "./StarRating";

interface Msg {
  id: string;
  sender: "CUSTOMER" | "MANAGER" | "SYSTEM";
  kind: "TEXT" | "RERATE_INVITE" | "RATING_UPDATE" | "REMINDER" | "FOLLOW_UP";
  body: string;
  createdAt: string;
}

interface Thread {
  role: "CUSTOMER" | "MANAGER";
  case: any;
  review: any;
  branch: any;
  manager: any;
  businessName: string;
  threshold: number;
  googleReviewUrl: string;
  messages: Msg[];
  notifications?: any[];
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Nuevo", cls: "bg-rose-100 text-rose-700" },
  IN_PROGRESS: { label: "En conversación", cls: "bg-amber-100 text-amber-800" },
  RESOLVED: { label: "Resuelto", cls: "bg-sky-100 text-sky-700" },
  RECOVERED: { label: "Cliente recuperado", cls: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Cerrado", cls: "bg-slate-200 text-slate-600" },
};

function time(d: string) {
  return new Date(d).toLocaleString("es-PE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
}

export default function CaseChat({ token, compact = false }: { token: string; compact?: boolean }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [rerateValue, setRerateValue] = useState(0);
  const [rerateComment, setRerateComment] = useState("");
  const [rerateResult, setRerateResult] = useState<{ recovered: boolean; rating: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/thread/${encodeURIComponent(token)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo cargar la conversación");
      setThread(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const n = thread?.messages.length || 0;
    if (n !== lastCount.current) {
      lastCount.current = n;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [thread?.messages.length]);

  const act = async (payload: any) => {
    setSending(true);
    try {
      const res = await fetch(`/api/public/thread/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      await load();
      return json;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setSending(false);
    }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const r = await act({ action: "message", body: text });
    if (r) setText("");
  };

  const doRerate = async () => {
    if (!rerateValue) return;
    const r = await act({ action: "rerate", rating: rerateValue, comment: rerateComment });
    if (r) setRerateResult({ recovered: r.recovered, rating: r.rating });
  };

  const openGoogle = async () => {
    const txt = rerateComment || thread?.review?.comment || "";
    if (txt) {
      try {
        await navigator.clipboard.writeText(txt);
        setCopied(true);
      } catch {}
    }
    window.open(thread?.googleReviewUrl, "_blank", "noopener");
  };

  if (!thread) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        {error ? <span className="text-rose-600">{error}</span> : "Cargando conversación…"}
      </div>
    );
  }

  const isManager = thread.role === "MANAGER";
  const st = STATUS_LABEL[thread.case.status] || STATUS_LABEL.OPEN;
  const closed = thread.case.status === "CLOSED";
  const lastInvite = [...thread.messages].reverse().find((m) => m.kind === "RERATE_INVITE");
  const lastRatingUpdate = [...thread.messages].reverse().find((m) => m.kind === "RATING_UPDATE");
  const pendingInvite = !isManager && lastInvite && (!lastRatingUpdate || new Date(lastRatingUpdate.createdAt) < new Date(lastInvite.createdAt));
  const recovered = thread.review?.status === "RECOVERED";
  const waCustomer = isManager && thread.case.customerPhone
    ? `https://wa.me/${String(thread.case.customerPhone).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${thread.case.customerName || ""}, te escribe ${thread.manager?.name || "el gerente"} de ${thread.businessName}. Vimos tu comentario y queremos solucionarlo.`)}`
    : null;

  return (
    <div className={`flex flex-col bg-white text-[#202124] ${compact ? "h-full" : "min-h-[70vh] rounded-2xl shadow-xl border border-slate-200"} overflow-hidden`}>
      {/* Cabecera estilo chat */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#075E54] text-white">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
          {(isManager ? thread.case.customerName : thread.manager?.name || thread.businessName || "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {isManager ? thread.case.customerName || "Cliente" : thread.manager?.name || "Gerente"}
          </div>
          <div className="text-xs text-white/80 truncate">
            {isManager
              ? `${thread.branch?.name || "Sin sucursal"} · calificó ${thread.review?.originalRating}★`
              : `${thread.manager?.role || "Gerente"} · ${thread.businessName}${thread.branch ? ` (${thread.branch.name})` : ""}`}
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
      </div>

      {/* Panel del gerente */}
      {isManager && (
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
            <span>
              Nota original: <StarsInline value={thread.review?.originalRating || 0} /> {thread.review?.originalRating}/5
            </span>
            {thread.review?.rating !== thread.review?.originalRating && (
              <span>
                Nota actual: <StarsInline value={thread.review?.rating || 0} /> {thread.review?.rating}/5
              </span>
            )}
            {thread.case.customerPhone && <span>📱 {thread.case.customerPhone}</span>}
            {thread.case.customerEmail && <span>✉️ {thread.case.customerEmail}</span>}
            {!thread.case.customerPhone && !thread.case.customerEmail && <span className="text-amber-700">El cliente no dejó contacto: solo puede responder en este chat.</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={sending || closed} onClick={() => act({ action: "invite_rerate" })} className="px-3 py-1.5 rounded-lg bg-[#1a73e8] text-white text-xs font-semibold disabled:opacity-50">
              ⭐ Invitar a re-calificar
            </button>
            {waCustomer && (
              <a href={waCustomer} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold">
                Abrir WhatsApp del cliente
              </a>
            )}
            {thread.case.customerEmail && (
              <a href={`mailto:${thread.case.customerEmail}?subject=${encodeURIComponent("Sobre tu visita a " + thread.businessName)}`} className="px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-semibold">
                Escribir correo
              </a>
            )}
            <select
              value={thread.case.status}
              disabled={sending}
              onChange={(e) => act({ action: "status", status: e.target.value })}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="OPEN">Nuevo</option>
              <option value="IN_PROGRESS">En conversación</option>
              <option value="RESOLVED">Resuelto</option>
              <option value="RECOVERED">Cliente recuperado</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-[#ECE5DD]" style={{ minHeight: compact ? 0 : 320 }}>
        {thread.messages.map((m) => {
          if (m.sender === "SYSTEM") {
            return (
              <div key={m.id} className="flex justify-center">
                <div className="max-w-[85%] text-center text-[12px] bg-[#FFF5C4] text-[#54656f] px-3 py-1.5 rounded-lg shadow-sm">{m.body}</div>
              </div>
            );
          }
          const mine = (isManager && m.sender === "MANAGER") || (!isManager && m.sender === "CUSTOMER");
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-lg shadow-sm text-[14px] leading-snug ${mine ? "bg-[#DCF8C6]" : "bg-white"}`}>
                {m.kind === "RERATE_INVITE" && <div className="text-[11px] font-semibold text-[#1a73e8] mb-1">⭐ Invitación a actualizar calificación</div>}
                {m.kind === "RATING_UPDATE" && <div className="text-[11px] font-semibold text-emerald-700 mb-1">Calificación actualizada</div>}
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className="text-[10px] text-[#667781] text-right mt-1">{time(m.createdAt)}</div>
              </div>
            </div>
          );
        })}

        {/* Re-calificación del cliente */}
        {pendingInvite && !rerateResult && !closed && (
          <div className="mx-auto max-w-sm bg-white rounded-2xl shadow-md p-4 text-center space-y-3">
            <div className="font-semibold">¿Cómo calificarías ahora tu experiencia?</div>
            <StarRating value={rerateValue} onChange={setRerateValue} size={36} />
            <textarea
              value={rerateComment}
              onChange={(e) => setRerateComment(e.target.value)}
              placeholder="Comentario (opcional)"
              rows={2}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
            <button disabled={!rerateValue || sending} onClick={doRerate} className="w-full py-2 rounded-full bg-[#1a73e8] text-white font-semibold disabled:opacity-40">
              Actualizar calificación
            </button>
          </div>
        )}

        {!isManager && (rerateResult?.recovered || recovered) && (
          <div className="mx-auto max-w-sm bg-white rounded-2xl shadow-md p-4 text-center space-y-3">
            <div className="text-2xl">🙌</div>
            <div className="font-semibold">¡Gracias por darnos otra oportunidad!</div>
            <p className="text-sm text-slate-600">Tu calificación quedó registrada. Si quieres, compártela también en Google.</p>
            <button onClick={openGoogle} className="w-full py-2 rounded-full bg-[#1a73e8] text-white font-semibold">
              Publicar reseña en Google
            </button>
            {copied && <div className="text-xs text-emerald-700">Copiamos tu comentario: solo pégalo en Google.</div>}
          </div>
        )}
        {!isManager && rerateResult && !rerateResult.recovered && (
          <div className="mx-auto max-w-sm bg-white rounded-xl shadow p-3 text-center text-sm text-slate-600">
            Gracias, el gerente verá tu nueva calificación ({rerateResult.rating}★) y seguirá atento.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Caja de texto */}
      {closed ? (
        <div className="px-4 py-3 text-center text-sm text-slate-500 bg-[#F0F2F5]">Esta conversación fue cerrada.</div>
      ) : (
        <form onSubmit={send} className="flex items-center gap-2 px-3 py-2 bg-[#F0F2F5]">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isManager ? "Escribe al cliente…" : "Escribe un mensaje…"}
            className="flex-1 rounded-full px-4 py-2.5 bg-white text-sm outline-none border border-transparent focus:border-[#25D366]"
          />
          <button disabled={sending || !text.trim()} className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center disabled:opacity-50" aria-label="Enviar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
          </button>
        </form>
      )}

      {error && <div className="px-4 py-2 text-xs text-rose-700 bg-rose-50">{error}</div>}

      {/* Registro de avisos (solo gerente) */}
      {isManager && thread.notifications && thread.notifications.length > 0 && !compact && (
        <details className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold">Avisos enviados ({thread.notifications.length})</summary>
          <ul className="mt-2 space-y-1">
            {thread.notifications.map((n: any) => (
              <li key={n.id} className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{time(n.createdAt)}</span>
                <span>{n.audience === "MANAGER" ? "→ Gerente" : "→ Cliente"}</span>
                <span>{n.channel}</span>
                <span className={n.status === "SENT" ? "text-emerald-700" : n.status === "FAILED" ? "text-rose-700" : "text-amber-700"}>
                  {n.status === "SIMULATED" ? "simulado (sin API configurada)" : n.status}
                </span>
                {n.deliveryUrl && (
                  <a className="text-[#1a73e8] underline" href={n.deliveryUrl} target="_blank" rel="noopener noreferrer">
                    enviar manualmente
                  </a>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
