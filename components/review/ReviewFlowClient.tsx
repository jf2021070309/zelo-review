"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import StarRating from "./StarRating";
import CaseChat from "./CaseChat";

interface Props {
  code: string;
  businessName: string;
  branchName: string | null;
  branchAddress: string | null;
  question: string;
  threshold: number;
  logo: string | null;
}

type Step = "rate" | "public" | "public-done" | "private" | "chat";

const font = { fontFamily: "Roboto, 'Google Sans', Arial, Helvetica, sans-serif" };

export default function ReviewFlowClient(props: Props) {
  const { code, businessName, branchName, branchAddress, threshold } = props;
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleUrl, setGoogleUrl] = useState("");
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [alwaysOfferGoogle, setAlwaysOfferGoogle] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openCase, setOpenCase] = useState<string | null>(null);
  const interacted = useRef(false);
  const storageKey = `zelo_case_${code}`;

  // Conversación abierta previa en este teléfono
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setOpenCase(saved);
      const savedName = localStorage.getItem("zelo_customer_name");
      if (savedName) setName(savedName);
    } catch {}
  }, [storageKey]);

  // "El cliente escanea pero no contesta nada": un único recordatorio suave
  useEffect(() => {
    if (step !== "rate") return;
    const t = setTimeout(() => {
      if (!interacted.current) setNudge(true);
    }, 15000);
    return () => clearTimeout(t);
  }, [step]);

  const pickRating = async (v: number) => {
    interacted.current = true;
    setNudge(false);
    setRating(v);
    setError(null);

    if (v > threshold) {
      // 4 o 5 estrellas: Celebración y redirección directa e inmediata a Google Reviews
      setStep("public-done");
      confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 }, colors: ["#FBBC04", "#4285F4", "#34A853", "#EA4335"] });

      try {
        const res = await fetch("/api/public/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, rating: v }),
        });
        const json = await res.json();
        const targetUrl = json.googleReviewUrl || "https://search.google.com/local/writereview";
        setGoogleUrl(targetUrl);
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 900);
      } catch {
        setTimeout(() => {
          window.location.href = googleUrl || "https://search.google.com/local/writereview";
        }, 900);
      }
    } else {
      // 1, 2 o 3 estrellas: Intercepción privada (nunca llega a Google)
      setStep("private");
    }
  };

  const changeRatingInComposer = (v: number) => {
    setRating(v);
    if (v > threshold) {
      pickRating(v);
    } else {
      setStep("private");
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        if (name.trim()) localStorage.setItem("zelo_customer_name", name.trim());
      } catch {}
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, rating, comment, authorName: name, customerPhone: phone, customerEmail: email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo enviar");
      setGoogleUrl(json.googleReviewUrl);
      if (json.outcome === "PUBLIC") {
        setStep("public-done");
        confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 }, colors: ["#FBBC04", "#4285F4", "#34A853", "#EA4335"] });
        setTimeout(() => {
          window.location.href = json.googleReviewUrl;
        }, 900);
      } else {
        setCustomerToken(json.customerToken);
        setAlwaysOfferGoogle(Boolean(json.alwaysOfferGoogle));
        try {
          localStorage.setItem(storageKey, json.customerToken);
        } catch {}
        setStep("chat");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goToGoogle = () => {
    window.location.href = googleUrl || "https://search.google.com/local/writereview";
  };

  const initial = (name.trim() || "T").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f1f3f4] text-[#202124] flex flex-col items-center px-3 py-6" style={font}>
      <div className="w-full max-w-[460px]">
        {/* Encabezado del negocio */}
        <div className="flex items-center gap-3 mb-4 px-1">
          {props.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logo} alt="" className="w-12 h-12 rounded-full object-cover bg-white shadow" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xl font-medium shadow">
              {businessName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[18px] font-medium leading-tight truncate">{businessName}</div>
            <div className="text-[13px] text-[#5f6368] truncate">{[branchName, branchAddress].filter(Boolean).join(" · ")}</div>
          </div>
        </div>

        {openCase && step === "rate" && (
          <button onClick={() => { setCustomerToken(openCase); setStep("chat"); }} className="w-full mb-3 text-left bg-white rounded-xl shadow-sm border border-[#dadce0] px-4 py-3 text-sm">
            💬 Tienes una conversación abierta con el gerente. <span className="text-[#1a73e8] font-medium">Abrir</span>
          </button>
        )}

        {/* PASO 1: calificación */}
        {step === "rate" && (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] px-6 pt-8 pb-7 text-center">
            <div className="text-[22px] leading-snug mb-1">{props.question || "¿Cómo calificarías tu visita?"}</div>
            <div className="text-sm text-[#5f6368] mb-6">Toca una estrella del 1 al 5</div>
            <StarRating value={rating} onChange={pickRating} size={48} />
            {nudge && (
              <div className="mt-5 inline-block bg-[#e8f0fe] text-[#174ea6] text-sm px-4 py-2 rounded-full animate-bounce">
                Solo toma 5 segundos ⭐ ¡Tu opinión nos ayuda mucho!
              </div>
            )}
          </div>
        )}

        {/* PASO 2A: reseña pública (estilo Google) */}
        {step === "public" && (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] overflow-hidden">
            <div className="px-6 pt-5 pb-3 border-b border-[#e8eaed]">
              <div className="text-[18px] font-medium">{businessName}</div>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7b1fa2] text-white flex items-center justify-center text-lg">{initial}</div>
                <div className="flex-1">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full text-[15px] font-medium outline-none border-b border-transparent focus:border-[#1a73e8] py-0.5"
                  />
                  <div className="text-[12px] text-[#5f6368] flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#5f6368"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 6h-3a15.6 15.6 0 00-1.4-3.6A8 8 0 0118.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8 8 0 010-4h3.4a16.5 16.5 0 000 4H4.3zm.8 2h3a15.6 15.6 0 001.4 3.6A8 8 0 015.1 16zM8 8H5.1a8 8 0 014.3-3.6C8.8 5.5 8.4 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 010-4h4.6a14.7 14.7 0 010 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h3a8 8 0 01-4.4 3.6zM16.3 14a16.5 16.5 0 000-4h3.4a8 8 0 010 4h-3.4z"/></svg>
                    Se publicará de forma pública
                  </div>
                </div>
              </div>
              <StarRating value={rating} onChange={changeRatingInComposer} size={40} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Comparte detalles de tu experiencia en este lugar"
                className="w-full rounded-lg border border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none p-3 text-[15px] resize-none"
              />
              {error && <div className="text-sm text-[#d93025]">{error}</div>}
            </div>
            <div className="flex justify-end gap-2 px-6 pb-5">
              <button onClick={() => { setStep("rate"); setRating(0); }} className="px-5 py-2 rounded-full text-[#1a73e8] font-medium hover:bg-[#f1f6fe]">
                Cancelar
              </button>
              <button onClick={submit} disabled={loading} className="px-6 py-2 rounded-full bg-[#1a73e8] text-white font-medium hover:bg-[#1765cc] disabled:opacity-60">
                {loading ? "Publicando…" : "Publicar"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3A: gracias + llevar a Google */}
        {step === "public-done" && (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] px-6 py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#e6f4ea] mx-auto flex items-center justify-center">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="#188038"><path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" /></svg>
            </div>
            <div className="text-[22px] font-semibold text-slate-800">¡Muchas gracias! ⭐</div>
            <p className="text-[15px] text-[#5f6368]">
              Nos alegra que hayas tenido una gran experiencia ({rating} estrellas).<br />
              Abriendo Google Reviews para publicar tu reseña...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-[#1a73e8] font-medium py-2">
              <div className="w-4 h-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
              <span>Redirigiendo a Google...</span>
            </div>
            <button onClick={goToGoogle} className="w-full py-3 rounded-full bg-[#1a73e8] text-white font-medium text-[15px] hover:bg-[#1765cc]">
              Abrir Google Reviews ahora
            </button>
          </div>
        )}

        {/* PASO 2B: feedback privado */}
        {step === "private" && (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center space-y-3">
              <StarRating value={rating} onChange={changeRatingInComposer} size={36} />
              <div className="text-[20px] leading-snug">Lamentamos que tu experiencia no fuera la mejor</div>
              <div className="text-[15px] text-[#5f6368]">¿Qué podemos mejorar?</div>
            </div>
            <div className="px-6 pb-2 space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Cuéntanos qué pasó…"
                className="w-full rounded-lg border border-[#dadce0] focus:border-[#1a73e8] outline-none p-3 text-[15px] resize-none"
              />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="w-full rounded-lg border border-[#dadce0] focus:border-[#1a73e8] outline-none px-3 py-2.5 text-[15px]" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="WhatsApp (opcional)" className="w-full rounded-lg border border-[#dadce0] focus:border-[#1a73e8] outline-none px-3 py-2.5 text-[15px]" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="Correo (opcional)" className="w-full rounded-lg border border-[#dadce0] focus:border-[#1a73e8] outline-none px-3 py-2.5 text-[15px]" />
              </div>
              <div className="flex items-start gap-2 text-[13px] text-[#5f6368] bg-[#f8f9fa] rounded-lg p-3">
                <span>🔒</span>
                <span>
                  Este mensaje es <b>privado</b>: llega directo al gerente{branchName ? ` de ${branchName}` : ""} para que lo solucione contigo. No se publica.
                </span>
              </div>
              {error && <div className="text-sm text-[#d93025]">{error}</div>}
            </div>
            <div className="flex justify-end gap-2 px-6 py-5">
              <button onClick={() => { setStep("rate"); setRating(0); }} className="px-5 py-2 rounded-full text-[#1a73e8] font-medium hover:bg-[#f1f6fe]">
                Volver
              </button>
              <button onClick={submit} disabled={loading || !comment.trim()} className="px-6 py-2 rounded-full bg-[#1a73e8] text-white font-medium disabled:opacity-50">
                {loading ? "Enviando…" : "Enviar al gerente"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3B: chat con el gerente */}
        {step === "chat" && customerToken && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl px-4 py-3 text-sm text-[#3c4043] shadow-sm">
              ✅ Gracias. El gerente ya fue avisado y te responderá por aquí{phone ? " o por WhatsApp" : ""}. Puedes cerrar esta página y volver con el mismo QR.
            </div>
            <div className="h-[65vh]">
              <CaseChat token={customerToken} compact />
            </div>
            {alwaysOfferGoogle && googleUrl && (
              <div className="text-center text-xs text-[#5f6368]">
                ¿Prefieres dejar tu opinión pública?{" "}
                <a href={googleUrl} className="text-[#1a73e8] underline" target="_blank" rel="noopener noreferrer">
                  Escribir en Google
                </a>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-[11px] text-[#80868b] mt-6">Con tecnología de ZELO Review</div>
      </div>
    </div>
  );
}
