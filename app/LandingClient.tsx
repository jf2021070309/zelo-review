"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Smartphone,
  QrCode,
  Star,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
  BarChart3,
  Globe,
  MessageCircle,
  Instagram,
  Utensils,
  Wifi,
  ExternalLink,
  Award,
  HelpCircle,
} from "lucide-react";

interface Props {
  isLoggedIn: boolean;
  userRole?: string;
}

export default function LandingClient({ isLoggedIn, userRole }: Props) {
  const [dailyCustomers, setDailyCustomers] = useState(120);
  const [conversionRate, setConversionRate] = useState(8); // 8% average leave reviews
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoTab, setDemoTab] = useState<"direct" | "hub">("direct");

  // Calculated estimates
  const monthlyScans = dailyCustomers * 30;
  const estimatedReviewsPerMonth = Math.round(monthlyScans * (conversionRate / 100));

  const faqs = [
    {
      q: "¿Cómo funciona la tecnología NFC de las placas Zelo?",
      a: "El chip NFC (Near Field Communication) integrado en el interior del acrílico transmite la señal inalámbrica al teléfono del cliente cuando este lo acerca a menos de 4 cm. No requiere ninguna app previa ni configuraciones complejas; abre automáticamente el navegador en iPhone y Android.",
    },
    {
      q: "¿Puedo cambiar el destino de mi placa después de haberla comprado?",
      a: "¡Sí, al 100%! A diferencia de las placas tradicionales estáticas, en Zelo Review tienes un panel de control en la nube donde puedes alternar en cualquier momento entre enviar al cliente directo a Google Reviews o a tu Smart Bio-Hub con WhatsApp, Instagram, Menú PDF y Wi-Fi.",
    },
    {
      q: "¿Por qué es importante tener analíticas separadas para QR y NFC?",
      a: "Porque te permite medir el comportamiento real de tus clientes. Nuestro sistema registra en tiempo real cuántas personas usaron el toque NFC versus cuántas escanearon el QR, así como el tipo de dispositivo y la hora pico de reseñas.",
    },
    {
      q: "¿Es resistente al agua, alcohol y limpieza de mesas?",
      a: "Absolutamente. Nuestras placas están fabricadas en acrílico de alta densidad de 3mm a 5mm con grabado láser e impresión UV de grado industrial, selladas herméticamente para soportar desinfectantes y uso rudo en restaurantes y mostradores.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-amber-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[35%] -left-40 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-[65%] -right-40 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070A12]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                ZELO<span className="text-amber-400">.</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mt-0.5">
                Review Plates
              </span>
            </div>
          </Link>

          {/* Nav Links Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#como-funciona" className="hover:text-white transition">Cómo Funciona</a>
            <a href="#beneficios" className="hover:text-white transition">Ventajas SaaS</a>
            <a href="#simulador" className="hover:text-amber-400 transition">Calculadora ROI</a>
            <a href="#planes" className="hover:text-white transition">Planes & Placas</a>
            <a href="#faq" className="hover:text-white transition">Preguntas</a>
          </nav>

          {/* Auth CTA Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href={userRole === "ADMIN" ? "/admin" : "/dashboard"}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <span>Ir a mi Panel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition transform active:scale-95"
                >
                  <span>Pedir Placas</span>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold tracking-wide">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Placas Acrílicas Inteligentes NFC + QR Dinámico</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Multiplica tus reseñas de{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                Google 5 Estrellas
              </span>{" "}
              en automático.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              El cliente solo acerca su celular o escanea el QR y en <strong>1 segundo</strong> califica tu negocio. Administra tus destinos en la nube, analiza métricas en tiempo real y convierte a tus visitantes en tu mejor publicidad.
            </p>

            {/* Quick Feature Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Sin instalar aplicaciones</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Destino 100% editable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Métricas QR vs NFC</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <span>Adquirir Placa Zelo</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="/r/ZL-DEMO02?src=nfc"
                target="_blank"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Probar Demo en Vivo</span>
              </a>
            </div>
          </div>

          {/* Right Hero: Acrylic Smart Plaque 3D Simulator (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-sm">
              {/* Outer Glow Halo */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-yellow-500 rounded-[36px] blur-xl opacity-50 group-hover:opacity-80 transition duration-700 animate-pulse-slow" />

              {/* Physical Acrylic Plaque Simulation */}
              <div className="relative rounded-[32px] p-7 bg-gradient-to-b from-[#101726] via-[#0B0F19] to-slate-950 border-2 border-slate-700/80 shadow-2xl text-center space-y-6 backdrop-blur-md">
                {/* Shiny Acrylic Highlight Top */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[30px]" />

                {/* Plaque Header */}
                <div className="space-y-2 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Tu Negocio Aquí
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Déjanos tu reseña en Google</span>
                  </div>
                </div>

                {/* Center QR Display on Plaque */}
                <div className="relative inline-block z-10 p-3.5 bg-white rounded-2xl shadow-2xl">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://zelo.pe/r/ZL-DEMO02?src=qr"
                    alt="Placa Zelo QR"
                    className="w-44 h-44 rounded-xl object-contain mx-auto"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-slate-950 rounded-xl p-1 shadow-lg border border-slate-800 flex items-center justify-center text-[10px] font-black text-amber-400">
                      ZL
                    </div>
                  </div>
                </div>

                {/* Instructions & Interactive Tap Demo Button */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                    <Smartphone className="w-4 h-4 text-indigo-400 animate-bounce" />
                    <span>Acerca tu teléfono o escanea con la cámara</span>
                  </div>

                  <a
                    href="/r/ZL-DEMO02?src=nfc"
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs transition"
                  >
                    <span>⚡ Simular Toque NFC de Cliente</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="text-[10px] font-mono text-slate-400">
                    PLACA INTELIGENTE ZELO #ZL-DEMO02
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / COMPARISON SECTION */}
      <section id="como-funciona" className="relative z-10 py-20 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              El Secreto del Crecimiento Acelerado
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ¿Por qué Zelo multiplica tus reseñas x5?
            </h3>
            <p className="text-sm sm:text-base text-slate-400">
              Pedirle al cliente que busque tu negocio manualmente en Google tiene un 95% de abandono. Con Zelo, el proceso toma solo 2 segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 font-black text-xl">
                1
              </div>
              <h4 className="text-lg font-bold text-white">El Cliente Acerca su Celular</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Ubicada en tus mesas, barra o recepción, el cliente acerca cualquier smartphone con NFC o escanea el QR con su cámara.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 font-black text-xl">
                2
              </div>
              <h4 className="text-lg font-bold text-white">Apertura Instantánea</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Sin logueos ni descargas, se abre directamente la pantalla de 5 estrellas de tu ficha oficial de Google Maps o tu Smart Bio-Hub.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 font-black text-xl">
                3
              </div>
              <h4 className="text-lg font-bold text-white">Reseña & Posicionamiento</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tu negocio sube en el ranking de Google Maps, superando a la competencia y atrayendo nuevos comensales orgánicos todos los días.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL MODE SAAS EXPLANATION */}
      <section id="beneficios" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Mucho más que un acrílico
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Placas Inteligentes Administrables desde la Nube
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            No vendas solo una placa fija. Transfórmala en un activo digital que se adapta a las campañas de tu negocio.
          </p>
        </div>

        {/* Interactive Modes Tabs Showcase */}
        <div className="glass-card rounded-3xl border border-slate-800 p-6 sm:p-10 space-y-8">
          <div className="flex justify-center">
            <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 inline-flex gap-2">
              <button
                onClick={() => setDemoTab("direct")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                  demoTab === "direct"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ⭐ Modo 1: Redirección Directa a Google
              </button>
              <button
                onClick={() => setDemoTab("hub")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                  demoTab === "hub"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📱 Modo 2: Smart Bio-Hub Intermedio
              </button>
            </div>
          </div>

          {demoTab === "direct" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                  <span>Enfoque Reseñas Máximas</span>
                </div>
                <h4 className="text-2xl font-bold text-white">
                  Directo al formulario de 5 estrellas en 1 toque
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Ideal para restaurantes, cafeterías, spas y clínicas donde la prioridad #1 es disparar la cantidad de reseñas en Google Maps. El cliente toca la placa y automáticamente se despliega la calificación sin pasos intermedios.
                </p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Redirección HTTP 302 instantánea (menos de 50ms)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Registro silencioso de analítica QR vs NFC</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <h5 className="font-bold text-white text-base">Flujo del Cliente:</h5>
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-amber-300 border border-slate-800">
                  Placa NFC / QR ➔ zelo.pe/r/ZL-DEMO01 ➔ Google Reviews (Directo)
                </div>
                <p className="text-xs text-slate-400">
                  El cliente nunca se distrae: califica inmediatamente.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                  <span>Enfoque Conexión Total</span>
                </div>
                <h4 className="text-2xl font-bold text-white">
                  Smart Bio-Hub: Reseñas + Redes + Carta + Wi-Fi
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Ofrece al cliente una experiencia completa: además del botón destacado de reseñas, permite que te contacten por WhatsApp, vean tu Instagram, abran tu carta digital PDF y se conecten a tu red Wi-Fi en un solo toque.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 text-xs border border-slate-800">⭐ Reseña Google</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-300 text-xs border border-slate-800">💬 WhatsApp</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-pink-300 text-xs border border-slate-800">📸 Instagram</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 text-xs border border-slate-800">📶 Clave Wi-Fi</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-purple-300 text-xs border border-slate-800">🍔 Carta Menú</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-white text-base">Portal Móvil Zelo Hub</h5>
                <a
                  href="/r/ZL-DEMO02?src=nfc"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  <span>Abrir Demostración del Hub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ROI CALCULATOR SECTION */}
      <section id="simulador" className="relative z-10 py-20 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Calculadora de Crecimiento
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ¿Cuántas reseñas puedes conseguir al mes?
            </h3>
            <p className="text-sm text-slate-400">
              Ajusta el volumen diario de clientes en tu local para ver tu proyección.
            </p>
          </div>

          <div className="glass-card p-8 sm:p-10 rounded-3xl border border-slate-800 space-y-8 shadow-2xl">
            {/* Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300">Clientes diarios atendidos en tu local:</span>
                <span className="text-xl font-mono font-bold text-amber-400">{dailyCustomers} clientes/día</span>
              </div>

              <input
                type="range"
                min={20}
                max={500}
                step={10}
                value={dailyCustomers}
                onChange={(e) => setDailyCustomers(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>20 clientes (Pequeño local)</span>
                <span>250 clientes</span>
                <span>500+ clientes (Gran restaurante)</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                <span className="text-xs text-slate-400">Escaneos Estimados</span>
                <div className="text-2xl font-black text-white">{monthlyScans}</div>
                <span className="text-[10px] text-slate-500">por mes en tus placas</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                <span className="text-xs text-amber-300 font-bold">Nuevas Reseñas 5★</span>
                <div className="text-3xl font-black text-amber-400">+{estimatedReviewsPerMonth}</div>
                <span className="text-[10px] text-amber-300/80">cada 30 días</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                <span className="text-xs text-slate-400">Impacto SEO Local</span>
                <div className="text-2xl font-black text-emerald-400">Top 3</div>
                <span className="text-[10px] text-slate-500">en búsquedas de Google Maps</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & PACKS */}
      <section id="planes" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Inversión Inteligente
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Elige el Pack Ideal para tu Negocio
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            Placas acrílicas grabadas con chip NFC y QR de alta resolución + Acceso a la plataforma ZELO Review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Pack 1 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pack Individual
              </span>
              <h4 className="text-2xl font-bold text-white">1 Placa Zelo</h4>
              <p className="text-xs text-slate-400">
                Ideal para mostradores de cobro, cajas o recepciones.
              </p>
              <div className="text-3xl font-black text-white">S/ 69 <span className="text-xs font-normal text-slate-400">pago único</span></div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1 Placa Acrílica NFC + QR</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Panel Web & Redirección Dinámica</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Métricas QR vs NFC</span>
                </li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition"
            >
              Pedir 1 Placa
            </Link>
          </div>

          {/* Pack 2 - Featured */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative glass-card p-8 rounded-3xl border border-amber-500/40 bg-slate-900/95 flex flex-col justify-between space-y-6 shadow-2xl h-full">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Más Popular</span>
                </div>
                <h4 className="text-2xl font-black text-white">Pack Restaurante Pro</h4>
                <p className="text-xs text-slate-300">
                  3 Placas para mesas principales, barra y caja de cobro.
                </p>
                <div className="text-3xl font-black text-amber-400">S/ 179 <span className="text-xs font-normal text-slate-400">pago único</span></div>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span><strong>3 Placas Acrílicas</strong> NFC + QR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Smart Bio-Hub con WhatsApp y Menú PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Analítica en tiempo real 24/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Envío express a nivel nacional</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs text-center shadow-lg shadow-amber-500/25 transition transform active:scale-95"
              >
                Pedir Pack Pro (3 Placas)
              </Link>
            </div>
          </div>

          {/* Pack 3 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pack Cadenas & Franquicias
              </span>
              <h4 className="text-2xl font-bold text-white">10+ Placas</h4>
              <p className="text-xs text-slate-400">
                Para hoteles, salones de eventos y cadenas gastronómicas.
              </p>
              <div className="text-3xl font-black text-white">Cotizar <span className="text-xs font-normal text-slate-400">por volumen</span></div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Placas con grabado de logo corporativo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Panel Multi-Sucursal centralizado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Soporte prioritario y asesoría</span>
                </li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition"
            >
              Contactar Asesor
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="relative z-10 py-20 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Respuestas Claras
            </h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              Preguntas Frecuentes
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl border border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-bold text-white hover:text-amber-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                      activeFaq === idx ? "rotate-180 text-amber-400" : "text-slate-500"
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-12 border-t border-slate-800 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">ZELO Review</span>
            <span>— Placas Inteligentes para Negocios</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition">Acceso Clientes</Link>
            <Link href="/claim/ZL-DEMO01" className="hover:text-white transition">Activar Placa</Link>
            <Link href="/admin" className="hover:text-amber-400 transition">SuperAdmin</Link>
          </div>

          <div>
            © {new Date().getFullYear()} ZELO Review. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
