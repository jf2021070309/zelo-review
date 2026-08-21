"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Star,
  MessageCircle,
  Instagram,
  Globe,
  Utensils,
  Wifi,
  MapPin,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface Props {
  device: {
    id: string;
    code: string;
    activationPin: string;
    status: string;
    mode: string;
    customDestinationUrl?: string | null;
    smartProfile?: any | null;
  };
  business: {
    name: string;
    googleReviewUrl?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    website?: string | null;
    logoUrl?: string | null;
  };
}

export default function DeviceConfigClient({ device, business }: Props) {
  const router = useRouter();

  // Mode state
  const [mode, setMode] = useState(device.mode);
  const [customDestinationUrl, setCustomDestinationUrl] = useState(
    device.customDestinationUrl || business.googleReviewUrl || ""
  );

  // Smart Profile state
  const sp = device.smartProfile;
  const [title, setTitle] = useState(sp?.title || business.name);
  const [description, setDescription] = useState(
    sp?.description ||
      "¡Gracias por visitarnos! Califica tu experiencia y déjanos tu reseña en Google para seguir mejorando."
  );
  const [theme, setTheme] = useState(sp?.theme || "dark_gold");

  // Modules
  const [googleReviewEnabled, setGoogleReviewEnabled] = useState(sp?.googleReviewEnabled ?? true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    sp?.googleReviewUrl || business.googleReviewUrl || "https://search.google.com/local/writereview"
  );

  const [whatsappEnabled, setWhatsappEnabled] = useState(sp?.whatsappEnabled ?? !!business.whatsapp);
  const [whatsappNumber, setWhatsappNumber] = useState(sp?.whatsappNumber || business.whatsapp || "");
  const [whatsappMessage, setWhatsappMessage] = useState(
    sp?.whatsappMessage || "¡Hola! Vengo desde su placa Zelo."
  );

  const [instagramEnabled, setInstagramEnabled] = useState(sp?.instagramEnabled ?? !!business.instagram);
  const [instagramHandle, setInstagramHandle] = useState(sp?.instagramHandle || business.instagram || "");

  const [websiteEnabled, setWebsiteEnabled] = useState(sp?.websiteEnabled ?? !!business.website);
  const [websiteUrl, setWebsiteUrl] = useState(sp?.websiteUrl || business.website || "");

  const [menuEnabled, setMenuEnabled] = useState(sp?.menuEnabled ?? false);
  const [menuUrl, setMenuUrl] = useState(sp?.menuUrl || "");

  const [wifiEnabled, setWifiEnabled] = useState(sp?.wifiEnabled ?? false);
  const [wifiSsid, setWifiSsid] = useState(sp?.wifiSsid || "");
  const [wifiPassword, setWifiPassword] = useState(sp?.wifiPassword || "");

  const [googleMapsEnabled, setGoogleMapsEnabled] = useState(sp?.googleMapsEnabled ?? false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(sp?.googleMapsUrl || "");

  // Custom links
  const [customLinks, setCustomLinks] = useState<Array<{ id?: string; title: string; url: string; icon: string }>>(
    sp?.customLinks?.map((l: any) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon,
    })) || []
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddCustomLink = () => {
    setCustomLinks([
      ...customLinks,
      {
        title: "Nuevo Botón / Promoción",
        url: "https://",
        icon: "gift",
      },
    ]);
  };

  const handleRemoveCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const handleUpdateCustomLink = (index: number, field: string, value: string) => {
    const updated = [...customLinks];
    updated[index] = { ...updated[index], [field]: value };
    setCustomLinks(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          customDestinationUrl,
          smartProfile: {
            title,
            description,
            theme,
            googleReviewEnabled,
            googleReviewUrl,
            whatsappEnabled,
            whatsappNumber,
            whatsappMessage,
            instagramEnabled,
            instagramHandle,
            websiteEnabled,
            websiteUrl,
            menuEnabled,
            menuUrl,
            wifiEnabled,
            wifiSsid,
            wifiPassword,
            googleMapsEnabled,
            googleMapsUrl,
            customLinks,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar cambios.");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/devices"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Configurar Placa {device.code}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PIN: {device.activationPin}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personaliza el comportamiento y los destinos cuando los clientes tocan o escanean esta placa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/r/${device.code}?src=qr`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Probar Placa</span>
          </a>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {saving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>¡Configuración guardada exitosamente! Los cambios ya están activos en la placa física.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Form Controls (Left) & Real-time Phone Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Area (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Selector Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>1. Modo de Funcionamiento</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Direct Redirect */}
              <button
                type="button"
                onClick={() => setMode("DIRECT_REDIRECT")}
                className={`p-4 rounded-xl border text-left transition-all space-y-2 ${
                  mode === "DIRECT_REDIRECT"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Redirección Directa</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      mode === "DIRECT_REDIRECT"
                        ? "border-amber-400 bg-amber-400"
                        : "border-slate-600"
                    }`}
                  >
                    {mode === "DIRECT_REDIRECT" && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Redirige instantáneamente a Google Reviews o a una URL específica sin pantallas intermedias.
                </p>
              </button>

              {/* Option B: Smart Bio-Profile Hub */}
              <button
                type="button"
                onClick={() => setMode("SMART_PROFILE")}
                className={`p-4 rounded-xl border text-left transition-all space-y-2 ${
                  mode === "SMART_PROFILE"
                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span>Smart Bio-Hub</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      mode === "SMART_PROFILE"
                        ? "border-indigo-400 bg-indigo-400"
                        : "border-slate-600"
                    }`}
                  >
                    {mode === "SMART_PROFILE" && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Muestra un portal personalizado con Google Reviews, WhatsApp, Instagram, Menú PDF y Wi-Fi.
                </p>
              </button>
            </div>

            {/* Direct URL input if Direct Redirect Mode */}
            {mode === "DIRECT_REDIRECT" && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  URL de Destino Directo (Google Reviews / Web / WhatsApp)
                </label>
                <input
                  type="url"
                  required
                  value={customDestinationUrl}
                  onChange={(e) => setCustomDestinationUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500">
                  Tip: Copia el enlace "Escribir una reseña" de tu perfil de negocio en Google Maps.
                </p>
              </div>
            )}
          </div>

          {/* Smart Profile Customizer (Shown if mode === 'SMART_PROFILE') */}
          {mode === "SMART_PROFILE" && (
            <div className="space-y-6">
              {/* Branding & Theme */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>2. Identidad y Tema Visual</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Título del Establecimiento</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tema de Color</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="dark_gold">✨ Dark Gold (Elegante & Reseñas)</option>
                      <option value="neon_indigo">⚡ Neon Indigo (Moderno & Tech)</option>
                      <option value="emerald_luxury">🌿 Emerald Luxury (Hoteles & Cafés)</option>
                      <option value="ruby_elegance">🍷 Ruby Elegance (Resto-Bares)</option>
                      <option value="clean_white">⚪ Clean Minimalist (Limpio & Claro)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mensaje de Bienvenida / Subtítulo</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Core Feature Switches */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>3. Botones y Módulos Activos</span>
                </h2>

                <div className="space-y-4">
                  {/* Google Reviews Module */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-white">Botón Google Reviews 5★</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={googleReviewEnabled}
                        onChange={(e) => setGoogleReviewEnabled(e.target.checked)}
                        className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>
                    {googleReviewEnabled && (
                      <input
                        type="url"
                        value={googleReviewUrl}
                        onChange={(e) => setGoogleReviewUrl(e.target.value)}
                        placeholder="https://search.google.com/local/writereview?placeid=..."
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                      />
                    )}
                  </div>

                  {/* WhatsApp Module */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-white">Atención por WhatsApp</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappEnabled}
                        onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                      />
                    </div>
                    {whatsappEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder="Número con código de país (Ej: 51987654321)"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                        />
                        <input
                          type="text"
                          value={whatsappMessage}
                          onChange={(e) => setWhatsappMessage(e.target.value)}
                          placeholder="Mensaje predeterminado"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Instagram Module */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-bold text-white">Perfil de Instagram</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={instagramEnabled}
                        onChange={(e) => setInstagramEnabled(e.target.checked)}
                        className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                      />
                    </div>
                    {instagramEnabled && (
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="@usuario_instagram"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    )}
                  </div>

                  {/* Carta Digital / Menú */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Utensils className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-white">Carta Digital / Menú PDF</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={menuEnabled}
                        onChange={(e) => setMenuEnabled(e.target.checked)}
                        className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>
                    {menuEnabled && (
                      <input
                        type="url"
                        value={menuUrl}
                        onChange={(e) => setMenuUrl(e.target.value)}
                        placeholder="https://minegocio.com/menu.pdf"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                      />
                    )}
                  </div>

                  {/* Wi-Fi Access */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Wifi className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold text-white">Acceso a Red Wi-Fi</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={wifiEnabled}
                        onChange={(e) => setWifiEnabled(e.target.checked)}
                        className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                      />
                    </div>
                    {wifiEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={wifiSsid}
                          onChange={(e) => setWifiSsid(e.target.value)}
                          placeholder="Nombre de red (SSID)"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                        />
                        <input
                          type="text"
                          value={wifiPassword}
                          onChange={(e) => setWifiPassword(e.target.value)}
                          placeholder="Contraseña del Wi-Fi"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Buttons */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">4. Botones Personalizados & Promos</h2>
                  <button
                    type="button"
                    onClick={handleAddCustomLink}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Botón</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {customLinks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No hay botones adicionales. Puedes añadir links a promociones, Spotify, TikTok, etc.
                    </p>
                  ) : (
                    customLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3"
                      >
                        <select
                          value={link.icon}
                          onChange={(e) => handleUpdateCustomLink(idx, "icon", e.target.value)}
                          className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        >
                          <option value="gift">🎁 Promo</option>
                          <option value="globe">🌐 Web</option>
                          <option value="music">🎵 Música</option>
                          <option value="shopping-bag">🛍️ Tienda</option>
                          <option value="phone">📞 Teléfono</option>
                        </select>

                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => handleUpdateCustomLink(idx, "title", e.target.value)}
                          placeholder="Texto del botón"
                          className="w-1/3 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        />

                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateCustomLink(idx, "url", e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveCustomLink(idx)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Phone Mockup Live Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-8 self-start space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Vista Previa en Tiempo Real</span>
            </span>
            <span className="text-[11px] text-slate-500">Formato Smartphone</span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full max-w-[340px] mx-auto rounded-[38px] p-3.5 bg-slate-900 border-[6px] border-slate-800 shadow-2xl shadow-black/80 relative overflow-hidden">
            {/* Phone Notch / Speaker */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-30" />

            {/* Phone Screen Container */}
            <div
              className={`w-full rounded-[28px] min-h-[580px] p-4 flex flex-col justify-between items-center text-center transition-colors duration-300 relative ${
                theme === "clean_white"
                  ? "bg-slate-100 text-slate-900"
                  : theme === "neon_indigo"
                  ? "bg-[#090D1A] text-white"
                  : theme === "emerald_luxury"
                  ? "bg-[#071410] text-white"
                  : theme === "ruby_elegance"
                  ? "bg-[#14080a] text-white"
                  : "bg-[#0A0D14] text-white"
              }`}
            >
              {/* Header inside phone */}
              <div className="w-full pt-8 space-y-2.5 flex flex-col items-center">
                <div className="w-16 h-16 rounded-xl p-1 bg-gradient-to-br from-amber-400/40 via-indigo-500/30 to-slate-800 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-lg bg-slate-800 flex items-center justify-center text-lg font-black text-white">
                    {title.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold truncate max-w-[240px]">{title || "Nombre de Negocio"}</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-2 px-2">
                    {description || "Tu opinión nos ayuda a crecer."}
                  </p>
                </div>

                {/* Google Review Box in Phone */}
                {googleReviewEnabled && (
                  <div className="w-full p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2 shadow-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Califícanos en Google
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1">
                      <span>Dejar Reseña Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                )}

                {/* Other Mini Buttons */}
                <div className="w-full space-y-1.5 pt-1">
                  {whatsappEnabled && (
                    <div className="w-full p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] font-semibold">WhatsApp</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </div>
                  )}

                  {instagramEnabled && (
                    <div className="w-full p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[11px] font-semibold">Instagram</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </div>
                  )}

                  {menuEnabled && (
                    <div className="w-full p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] font-semibold">Carta Digital</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </div>
                  )}

                  {wifiEnabled && (
                    <div className="w-full p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px] font-semibold">Clave Wi-Fi</span>
                      </div>
                      <span className="text-[9px] text-cyan-400 font-mono">Conectar</span>
                    </div>
                  )}

                  {customLinks.map((cl, i) => (
                    <div
                      key={i}
                      className="w-full p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-[11px] font-semibold truncate">{cl.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Phone Footer */}
              <div className="text-[9px] text-slate-500 pt-3">
                Placa Zelo {device.code}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
