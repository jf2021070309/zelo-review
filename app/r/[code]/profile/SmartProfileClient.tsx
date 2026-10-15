"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import {
  Star,
  MessageCircle,
  Instagram,
  Globe,
  Utensils,
  Wifi,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Gift,
  Phone,
  Music,
  ShoppingBag,
} from "lucide-react";
import {
  ensureHttpUrl,
  normalizeInstagramUrl,
  getInstagramDisplayHandle,
  normalizeFacebookUrl,
  normalizeTiktokUrl,
  normalizeWhatsAppUrl,
} from "@/lib/utils";

interface SmartProfileData {
  title: string;
  description: string;
  theme: string;
  googleReviewUrl: string;
  googleReviewEnabled: boolean;
  facebookUrl?: string | null;
  facebookEnabled?: boolean;
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
  whatsappEnabled: boolean;
  instagramHandle?: string | null;
  instagramEnabled: boolean;
  websiteUrl?: string | null;
  websiteEnabled: boolean;
  menuUrl?: string | null;
  menuEnabled: boolean;
  wifiSsid?: string | null;
  wifiPassword?: string | null;
  wifiEnabled: boolean;
  googleMapsUrl?: string | null;
  googleMapsEnabled: boolean;
  customLinks: Array<{
    id: string;
    title: string;
    url: string;
    icon: string;
  }>;
}

interface Props {
  deviceCode: string;
  businessName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  profile: SmartProfileData;
}

export default function SmartProfileClient({
  deviceCode,
  businessName,
  logoUrl,
  profile,
}: Props) {
  const [wifiCopied, setWifiCopied] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(5);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#fbbf24", "#6366f1", "#ffffff"],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      window.open(ensureHttpUrl(profile.googleReviewUrl), "_blank");
    }, 600);
  };

  const copyWifiPassword = () => {
    if (profile.wifiPassword) {
      navigator.clipboard.writeText(profile.wifiPassword);
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 3000);
    }
  };

  // Theme presets
  const getThemeStyles = () => {
    switch (profile.theme) {
      case "neon_indigo":
        return {
          bg: "bg-[#090D1A]",
          card: "bg-slate-900/80 border-indigo-500/20 hover:border-indigo-500/50 shadow-indigo-950/50",
          accent: "from-indigo-500 to-cyan-500",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
          reviewBtn: "from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/30",
        };
      case "emerald_luxury":
        return {
          bg: "bg-[#071410]",
          card: "bg-emerald-950/40 border-emerald-500/20 hover:border-emerald-500/50 shadow-emerald-950/50",
          accent: "from-emerald-400 to-teal-500",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          reviewBtn: "from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30",
        };
      case "ruby_elegance":
        return {
          bg: "bg-[#14080a]",
          card: "bg-rose-950/40 border-rose-500/20 hover:border-rose-500/50 shadow-rose-950/50",
          accent: "from-rose-500 to-amber-500",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          reviewBtn: "from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30",
        };
      case "clean_white":
        return {
          bg: "bg-slate-100 text-slate-900",
          card: "bg-white border-slate-200 hover:border-slate-400 shadow-slate-300/50 text-slate-900",
          accent: "from-slate-800 to-slate-900",
          badge: "bg-slate-200 text-slate-800 border-slate-300",
          reviewBtn: "from-amber-500 to-amber-600 text-white shadow-amber-500/30",
        };
      case "dark_gold":
      default:
        return {
          bg: "bg-[#0A0D14]",
          card: "bg-slate-900/70 border-slate-800 hover:border-amber-500/40 shadow-black/40",
          accent: "from-amber-400 via-yellow-300 to-amber-500",
          badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          reviewBtn: "from-gradient-gold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20",
        };
    }
  };

  const theme = getThemeStyles();

  // WhatsApp formatted link
  const cleanPhone = profile.whatsappNumber?.replace(/[^0-9]/g, "") || "";
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    profile.whatsappMessage || "¡Hola! Vengo desde su placa Zelo."
  )}`;

  const getCustomIcon = (iconName: string) => {
    switch (iconName) {
      case "gift":
        return <Gift className="w-5 h-5 text-pink-400" />;
      case "music":
        return <Music className="w-5 h-5 text-cyan-400" />;
      case "shopping-bag":
        return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
      case "phone":
        return <Phone className="w-5 h-5 text-green-400" />;
      default:
        return <Globe className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-between p-4 sm:p-6 transition-colors duration-300`}>
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <main className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center pt-4 pb-8 space-y-6">
        {/* Business Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Logo / Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-br from-amber-400/40 via-indigo-500/30 to-slate-800 shadow-xl flex items-center justify-center backdrop-blur-md">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center text-3xl font-extrabold text-white">
                  {businessName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-900 w-5 h-5 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md mb-1 bg-amber-500/10 text-amber-300 border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verificado ZELO NFC</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{profile.title}</h1>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              {profile.description}
            </p>
          </div>
        </div>

        {/* PRIMARY CTA: GOOGLE REVIEW 5-STAR SECTION */}
        {profile.googleReviewEnabled && (
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-2xl blur opacity-40 group-hover:opacity-80 transition duration-300" />
            
            <div className="relative glass-card rounded-2xl p-5 border border-amber-500/30 text-center space-y-4 bg-slate-900/90 shadow-2xl">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Tu opinión nos ayuda a crecer
                </span>
              </div>

              {/* Star Rating Interactive Bar */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onClick={() => handleRatingClick(star)}
                    className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                    aria-label={`Calificar con ${star} estrellas`}
                  >
                    <Star
                      className={`w-9 h-9 ${
                        star <= (hoveredStar || 5)
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : "text-slate-600"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              {/* Main Button */}
              <button
                onClick={() => handleRatingClick(5)}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 shadow-lg ${theme.reviewBtn}`}
              >
                <Star className="w-5 h-5 fill-current" />
                <span>Dejar Reseña en Google (5★)</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-75" />
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">⚡ Rápido y sin registro</span>
                <span>•</span>
                <span className="flex items-center gap-1">⭐ Calificación oficial</span>
              </div>
            </div>
          </div>
        )}

        {/* SECONDARY ACTION BUTTONS */}
        <div className="w-full space-y-2.5">
          {/* WhatsApp Direct */}
          {profile.whatsappEnabled && profile.whatsappNumber && (
            <a
              href={normalizeWhatsAppUrl(profile.whatsappNumber, profile.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Chatear por WhatsApp</div>
                  <div className="text-xs text-slate-400">Atención inmediata y reservas</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}

          {/* Instagram */}
          {profile.instagramEnabled && profile.instagramHandle && (
            <a
              href={normalizeInstagramUrl(profile.instagramHandle)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Síguenos en Instagram</div>
                  <div className="text-xs text-slate-400">{getInstagramDisplayHandle(profile.instagramHandle)}</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}

          {/* Facebook */}
          {(profile.facebookEnabled ?? true) && profile.facebookUrl && (
            <a
              href={normalizeFacebookUrl(profile.facebookUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Página de Facebook</div>
                  <div className="text-xs text-slate-400">Síguenos y entérate de novedades</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}

          {/* Carta Digital / Menú */}
          {profile.menuEnabled && profile.menuUrl && (
            <a
              href={ensureHttpUrl(profile.menuUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Ver Carta Digital / Menú</div>
                  <div className="text-xs text-slate-400">Precios y platillos actualizados</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}

          {/* Wi-Fi Access */}
          {profile.wifiEnabled && (profile.wifiSsid || profile.wifiPassword) && (
            <button
              onClick={() => setShowWifiModal(true)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Conectarse a la Red Wi-Fi</div>
                  <div className="text-xs text-slate-400">Red: {profile.wifiSsid || "Wi-Fi Clientes"}</div>
                </div>
              </div>
              <div className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                Ver clave
              </div>
            </button>
          )}

          {/* Website */}
          {profile.websiteEnabled && profile.websiteUrl && (
            <a
              href={ensureHttpUrl(profile.websiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Página Web Oficial</div>
                  <div className="text-xs text-slate-400">{profile.websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}

          {/* Google Maps */}
          {profile.googleMapsEnabled && profile.googleMapsUrl && (
            <a
              href={ensureHttpUrl(profile.googleMapsUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Cómo Llegar (Google Maps)</div>
                  <div className="text-xs text-slate-400">Ver ubicación y rutas</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}

          {/* Custom Links */}
          {profile.customLinks.map((link) => {
            const url = link.icon === "music" ? normalizeTiktokUrl(link.url) : ensureHttpUrl(link.url);
            return (
              <a
                key={link.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 glass-card-hover ${theme.card}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/80 text-white flex items-center justify-center border border-slate-700">
                    {getCustomIcon(link.icon)}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-sm">{link.title}</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            );
          })}
        </div>
      </main>

      {/* Wi-Fi Password Modal */}
      {showWifiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
              <Wifi className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Conexión Wi-Fi</h3>
              <p className="text-xs text-slate-400">Conéctate a la red del establecimiento</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-800 text-left">
              <div>
                <span className="text-xs text-slate-500 block">Nombre de Red (SSID)</span>
                <span className="text-sm font-semibold text-white">{profile.wifiSsid || "Wi-Fi Clientes"}</span>
              </div>
              {profile.wifiPassword && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500 block">Contraseña</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-mono font-bold text-amber-400">{profile.wifiPassword}</span>
                    <button
                      onClick={copyWifiPassword}
                      className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 transition"
                    >
                      {wifiCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{wifiCopied ? "Copiada" : "Copiar"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowWifiModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="relative z-10 text-center py-4 space-y-1">
        <a
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition group"
        >
          <span>Placa Inteligente por</span>
          <span className="font-bold text-indigo-400 group-hover:text-indigo-300">ZELO Review</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </a>
        <p className="text-[10px] text-slate-400">ID de Placa: {deviceCode}</p>
      </footer>
    </div>
  );
}
