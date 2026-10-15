"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  MapPin,
  Star,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Sparkles,
  Search,
  Download,
  History,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";

interface SavedPlace {
  id: string;
  name: string;
  placeId: string;
  reviewUrl: string;
  createdAt: string;
}

export default function GoogleReviewsPage() {
  const router = useRouter();

  // Inputs
  const [businessName, setBusinessName] = useState("");
  const [placeIdInput, setPlaceIdInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // History State
  const [history, setHistory] = useState<SavedPlace[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zelo_place_id_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  // Extraer Place ID limpio si el usuario pegó una URL completa de Google Maps
  const cleanPlaceId = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "";

    // Si ya es un Place ID directo (ej: ChIJ...)
    if (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
      return trimmed;
    }

    // Si pegó una URL con placeid= o place_id=
    const placeIdParam = trimmed.match(/[?&]place(?:_)?id=([A-Za-z0-9_-]+)/i);
    if (placeIdParam && placeIdParam[1]) {
      return placeIdParam[1];
    }

    // Si pegó una URL con /place/.../data=...
    const dataMatch = trimmed.match(/!1s(0x[0-9a-f]+:[0-9a-f]+)/i);
    if (dataMatch && dataMatch[1]) {
      return dataMatch[1];
    }

    return trimmed;
  };

  const currentPlaceId = cleanPlaceId(placeIdInput);

  // URLs generadas automáticamente
  const directReviewUrl = currentPlaceId
    ? `https://search.google.com/local/writereview?placeid=${currentPlaceId}`
    : "";

  const mapsProfileUrl = currentPlaceId
    ? `https://www.google.com/maps/place/?q=place_id:${currentPlaceId}`
    : "";

  // Generar QR en tiempo real cuando cambie la URL directa
  useEffect(() => {
    if (!directReviewUrl) {
      setQrDataUrl("");
      return;
    }

    setIsGeneratingQr(true);
    QRCode.toDataURL(directReviewUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGeneratingQr(false);
      })
      .catch((err) => {
        console.error("Error generating QR:", err);
        setIsGeneratingQr(false);
      });
  }, [directReviewUrl]);

  // Copiar al portapapeles con feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Guardar en historial
  const handleSaveToHistory = () => {
    if (!currentPlaceId) return;

    const newEntry: SavedPlace = {
      id: Date.now().toString(),
      name: businessName.trim() || `Negocio (${currentPlaceId.slice(0, 10)}...)`,
      placeId: currentPlaceId,
      reviewUrl: directReviewUrl,
      createdAt: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updated = [newEntry, ...history.filter((h) => h.placeId !== currentPlaceId)].slice(0, 10);
    setHistory(updated);
    try {
      localStorage.setItem("zelo_place_id_history", JSON.stringify(updated));
    } catch {}
  };

  // Eliminar elemento de historial
  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem("zelo_place_id_history", JSON.stringify(updated));
    } catch {}
  };

  // Cargar desde historial
  const handleSelectHistory = (item: SavedPlace) => {
    setBusinessName(item.name);
    setPlaceIdInput(item.placeId);
  };

  // Descargar código QR en PNG
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const filename = businessName.trim()
      ? `QR_GOOGLE_${businessName.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`
      : `QR_GOOGLE_${currentPlaceId}.png`;
    a.download = filename;
    a.click();
  };

  // Redirigir al creador de placas con esta URL prellenada
  const handleCreatePlate = () => {
    if (!directReviewUrl) return;
    handleSaveToHistory();
    const targetUrl = `/dashboard?newPlate=1&googleUrl=${encodeURIComponent(
      directReviewUrl
    )}&businessName=${encodeURIComponent(businessName.trim())}`;
    router.push(targetUrl);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-900/40 border border-amber-500/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Google Place ID Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Generador de Enlaces Directos de Reseñas de Google
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Obtén el enlace oficial que abre de inmediato la **ventana emergente de 5 estrellas** en el
            dispositivo del cliente al acercar su teléfono a la placa NFC o escanear el código QR.
          </p>
        </div>
      </div>

      {/* Grid Central: Entrada y Resultado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formulario e Integración Place ID (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-base font-bold text-white">Parámetros del Negocio</h2>
              </div>
              <span className="text-xs text-amber-400/90 font-medium">Requerido: Place ID</span>
            </div>

            {/* Input 1: Nombre del Negocio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Nombre del Comercio (Opcional)</span>
                <span className="text-[10px] text-slate-500 font-normal">Para nombrar el archivo QR</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Café París, Clínica Zelo, Barbería Roma"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition"
              />
            </div>

            {/* Input 2: Google Place ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Google Place ID o Enlace de Google Maps</span>
                </label>
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id?hl=es#find-id"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                >
                  <Search className="w-3 h-3" />
                  <span>Buscar Place ID Oficial</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pega aquí tu Place ID (ej. ChIJN1t_tDeuEmsRUsoyG83frY4) o link de Maps"
                  value={placeIdInput}
                  onChange={(e) => setPlaceIdInput(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition"
                />
                {placeIdInput && (
                  <button
                    onClick={() => setPlaceIdInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    title="Limpiar"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Acepta el código limpio <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">ChIJ...</code> o cualquier enlace copiado de Google Maps.
                </span>
              </p>
            </div>

            {/* Asistente Rápido: Buscar Place ID de Google */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  <span>¿No conoces tu Place ID? Usa el buscador oficial</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Herramienta Gratuita
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Google proporciona un mapa interactivo para encontrar el código exacto de cualquier negocio en segundos:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id?hl=es#find-id"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-2 transition group"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition" />
                  <span>Abrir Google Place ID Finder</span>
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                </a>

                {businessName.trim() && (
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(businessName.trim())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Search className="w-3 h-3" />
                    <span>Buscar &quot;{businessName.trim()}&quot; en Maps</span>
                  </a>
                )}
              </div>
            </div>

            {/* Ejemplos predefinidos para pruebas rápidas */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Probar con ejemplos reales:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBusinessName("Torre Eiffel");
                    setPlaceIdInput("ChIJLU7jZClu5kcR4PcOOO6pAAA");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-[11px] transition"
                >
                  🗼 Torre Eiffel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBusinessName("Empire State Building");
                    setPlaceIdInput("ChIJaXQRs6lZwokRY6EFaGS9wT过来");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-[11px] transition"
                >
                  🗽 Empire State
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBusinessName("Restaurante Central Lima");
                    setPlaceIdInput("ChIJpQ3Z6f3PBZERSdI1aT_eAAY");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-[11px] transition"
                >
                  🍽️ Restaurante Central
                </button>
              </div>
            </div>
          </div>

          {/* Historial de Place IDs Recientes */}
          {history.length > 0 && (
            <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-300">Generados Recientemente</h3>
                </div>
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("zelo_place_id_history");
                  }}
                  className="text-[11px] text-slate-500 hover:text-red-400 transition"
                >
                  Limpiar historial
                </button>
              </div>

              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <button
                      onClick={() => handleSelectHistory(item)}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="font-semibold text-white text-xs truncate">{item.name}</div>
                      <div className="text-[10px] font-mono text-amber-400/90 truncate">
                        {item.placeId}
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => handleCopy(item.reviewUrl, `hist-${item.id}`)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs"
                        title="Copiar enlace"
                      >
                        {copiedKey === `hist-${item.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 text-xs"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resultado, Enlaces y QR (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-white">Enlaces Generados</h2>
              </div>
              {currentPlaceId ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Listo para Placa
                </span>
              ) : (
                <span className="text-xs text-slate-500">Esperando Place ID</span>
              )}
            </div>

            {currentPlaceId ? (
              <div className="space-y-4">
                {/* 1. Enlace Oficial Directo de 5 Estrellas */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>Enlace Oficial 5 Estrellas (Recomendado)</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">writereview</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-200 break-all select-all">
                    {directReviewUrl}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopy(directReviewUrl, "direct")}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 transition"
                    >
                      {copiedKey === "direct" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Enlace</span>
                        </>
                      )}
                    </button>

                    <a
                      href={directReviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition"
                      title="Probar en pestaña nueva"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Probar</span>
                    </a>
                  </div>
                </div>

                {/* 2. Enlace a Perfil en Maps */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Ficha en Google Maps</span>
                    <button
                      onClick={() => handleCopy(mapsProfileUrl, "maps")}
                      className="text-amber-400 hover:text-amber-300 font-medium text-[11px] flex items-center gap-1"
                    >
                      {copiedKey === "maps" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "maps" ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 truncate">
                    {mapsProfileUrl}
                  </div>
                </div>

                {/* Vista previa del Código QR */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="text-xs font-semibold text-slate-300">
                    Vista Previa del Código QR
                  </div>

                  {isGeneratingQr ? (
                    <div className="w-44 h-44 rounded-xl bg-slate-950 flex items-center justify-center text-xs text-slate-500">
                      Generando QR...
                    </div>
                  ) : qrDataUrl ? (
                    <div className="relative group p-3 bg-white rounded-2xl shadow-xl shadow-amber-500/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="QR Google Reviews"
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                  ) : null}

                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Escanea con tu móvil para comprobar que abre la ventana de 5 estrellas al instante.
                  </p>

                  <div className="flex w-full gap-2">
                    <button
                      onClick={handleDownloadQr}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PNG</span>
                    </button>
                  </div>
                </div>

                {/* Botón Principal: Crear Placa en Zelo con este Enlace */}
                <button
                  onClick={handleCreatePlate}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition transform hover:scale-[1.01]"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Crear Placa con este Enlace Directo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <Star className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-400">
                  Ingresa un Place ID para generar el enlace
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Al ingresar el código de tu comercio, verás el enlace directo y el código QR de prueba aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección Informativa: ¿Por qué usar Place ID en las placas ZELO? */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Apertura Directa en 1 Toque</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            El enlace con <code className="text-amber-400">writereview?placeid=...</code> abre directamente la caja de diálogo para calificar con 5 estrellas, ahorrando hasta 3 clics al cliente.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Identificador Inmutable</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Incluso si el negocio cambia su nombre comercial o dirección en Maps, el Place ID de Google sigue perteneciendo al mismo negocio y nunca se rompe.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Compatible con NFC y QR</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Funciona automáticamente tanto en iPhone (iOS) como en Android cuando el visitante acerca su celular al chip NFC o escanea con la cámara.
          </p>
        </div>
      </div>
    </div>
  );
}
