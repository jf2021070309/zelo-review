"use client";

import {
  Sparkles,
  QrCode,
  Smartphone,
  Eye,
  TrendingUp,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface Props {
  business: {
    id: string;
    name: string;
    slug: string;
    googleReviewUrl?: string | null;
  };
  devices: Array<{
    id: string;
    code: string;
    status: string;
    mode: string;
    _count: { scanEvents: number };
  }>;
  stats: {
    totalScans: number;
    qrScans: number;
    nfcScans: number;
    directScans: number;
    activeDevicesCount: number;
  };
  chartData: Array<{
    date: string;
    qr: number;
    nfc: number;
    total: number;
  }>;
  recentScans: Array<{
    id: string;
    deviceCode: string;
    source: string;
    os: string;
    browser: string;
    deviceType: string;
    createdAt: string;
  }>;
}

export default function DashboardOverviewClient({
  business,
  devices,
  stats,
  chartData,
  recentScans,
}: Props) {
  const qrPercent = stats.totalScans > 0 ? Math.round((stats.qrScans / stats.totalScans) * 100) : 0;
  const nfcPercent = stats.totalScans > 0 ? Math.round((stats.nfcScans / stats.totalScans) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/30 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Panel en Tiempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hola, {business.name}
          </h1>
          <p className="text-sm text-slate-400">
            Monitorea el impacto de tus placas inteligentes, reseñas y conexiones de clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/devices"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Gestionar Placas</span>
          </Link>
          <Link
            href="/dashboard/qr"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Descargar QR</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Interacciones
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">{stats.totalScans}</div>
            <div className="text-xs text-indigo-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Clientes conectados a tu negocio</span>
            </div>
          </div>
        </div>

        {/* QR Scans */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              📷 Escaneos QR
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-amber-400">{stats.qrScans}</div>
            <div className="text-xs text-slate-400">
              Representa el <span className="font-bold text-amber-300">{qrPercent}%</span> del total
            </div>
          </div>
        </div>

        {/* NFC Taps */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              📱 Toques NFC
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-400">{stats.nfcScans}</div>
            <div className="text-xs text-slate-400">
              Representa el <span className="font-bold text-emerald-300">{nfcPercent}%</span> del total
            </div>
          </div>
        </div>

        {/* Active Plates */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Placas Activas
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">{stats.activeDevicesCount}</div>
            <div className="text-xs text-cyan-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transmitiendo reseñas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Evolución de Interacciones</h2>
              <p className="text-xs text-slate-400">Visitas diarias registradas en los últimos 14 días</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-400">QR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-slate-400">NFC</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNfc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="qr"
                  name="📷 QR"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorQr)"
                />
                <Area
                  type="monotone"
                  dataKey="nfc"
                  name="📱 NFC"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNfc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* QR vs NFC Ratio Box (1 col) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Canal de Acceso</h2>
            <p className="text-xs text-slate-400">Distribución de clientes según método de escaneo</p>
          </div>

          {/* Visual Percentage Bars */}
          <div className="space-y-5">
            {/* QR Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Código QR</span>
                </span>
                <span className="text-white">{stats.qrScans} ({qrPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${qrPercent}%` }}
                />
              </div>
            </div>

            {/* NFC Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Toque NFC</span>
                </span>
                <span className="text-white">{stats.nfcScans} ({nfcPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${nfcPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dato clave de conversión</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Los toques NFC reducen la fricción en más de un 70% porque no requieren abrir la cámara.
            </p>
          </div>
        </div>
      </div>

      {/* Plates Quick Table & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Plates */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">Tus Placas Vinculadas</h2>
              <p className="text-xs text-slate-400">Acceso rápido y configuración</p>
            </div>
            <Link
              href="/dashboard/devices"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {devices.slice(0, 4).map((device) => (
              <div
                key={device.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{device.code}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {device.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Modo:{" "}
                    <span className="text-slate-300 font-medium">
                      {device.mode === "SMART_PROFILE" ? "Smart Bio-Hub" : "Redirección Directa"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/r/${device.code}?src=qr`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Probar flujo QR"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs flex items-center gap-1 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Test QR</span>
                  </a>
                  <Link
                    href={`/dashboard/devices/${device.id}`}
                    className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                  >
                    Configurar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Scan Stream */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">Últimas Interacciones</h2>
              <p className="text-xs text-slate-400">Registro en vivo de escaneos y toques</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {recentScans.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Aún no hay escaneos registrados. ¡Haz tu primera prueba escaneando tu placa!
              </p>
            ) : (
              recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        scan.source === "QR"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {scan.source === "QR" ? "QR" : "NFC"}
                    </div>
                    <div>
                      <div className="font-semibold text-white">Placa {scan.deviceCode}</div>
                      <div className="text-[11px] text-slate-400">
                        {scan.os} • {scan.browser}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(scan.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
