"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  QrCode,
  Sparkles,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Settings2,
  Sliders,
  ShieldCheck,
  Activity,
  ChevronRight,
  Zap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DeviceItem {
  id: string;
  code: string;
  activationPin: string;
  status: string;
  mode: string;
  customDestinationUrl?: string | null;
  createdAt: string;
  totalScans: number;
  qrScans: number;
  nfcScans: number;
}

interface Props {
  devices: DeviceItem[];
  businessName: string;
}

export default function DevicesClient({ devices: initialDevices, businessName }: Props) {
  const [devices, setDevices] = useState(initialDevices);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const getFullUrl = (code: string, src: "qr" | "nfc") => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/r/${code}?src=${src}`;
    }
    return `https://zelo.pe/r/${code}?src=${src}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleToggleMode = async (deviceId: string, currentMode: string) => {
    const nextMode = currentMode === "DIRECT_REDIRECT" ? "SMART_PROFILE" : "DIRECT_REDIRECT";
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode }),
      });
      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? { ...d, mode: nextMode } : d))
        );
      }
    } catch (err) {
      console.error("Error toggling mode:", err);
    }
  };

  const handleClaimDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setLoadingClaim(true);

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          pin: newPin,
          businessName: businessName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo activar la placa.");

      // Refresh list
      window.location.reload();
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setLoadingClaim(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Placas Inteligentes Zelo
          </h1>
          <p className="text-sm text-slate-400">
            Administra tus placas físicas, cambia sus destinos al instante y copia sus enlaces.
          </p>
        </div>

        <button
          onClick={() => setShowClaimModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Vincular Nueva Placa</span>
        </button>
      </div>

      {/* Plates Grid */}
      {devices.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Smartphone className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">No tienes placas vinculadas</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Si compraste una placa física Zelo, haz clic en "Vincular Nueva Placa" e ingresa su código y PIN.
            </p>
          </div>
          <button
            onClick={() => setShowClaimModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Vincular mi Primera Placa</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.map((device) => {
            const qrUrl = getFullUrl(device.code, "qr");
            const nfcUrl = getFullUrl(device.code, "nfc");

            return (
              <div
                key={device.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 hover:border-slate-700 transition"
              >
                {/* Plate Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shadow-md">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-black text-white">{device.code}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {device.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        PIN de seguridad: <span className="font-mono text-slate-300 font-bold">{device.activationPin}</span>
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/devices/${device.id}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>Personalizar</span>
                  </Link>
                </div>

                {/* Mode Selector Switch */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo de Comportamiento:</span>
                    </span>

                    <button
                      onClick={() => handleToggleMode(device.id, device.mode)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        device.mode === "DIRECT_REDIRECT"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      <span>
                        {device.mode === "DIRECT_REDIRECT" ? "⭐ Redirección Directa" : "📱 Smart Bio-Hub"}
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {device.mode === "DIRECT_REDIRECT"
                      ? "Redirige automáticamente al cliente a tu ficha de Google Reviews en 1 segundo."
                      : "Muestra tu portal interactivo con botón de 5 estrellas, WhatsApp, Instagram, Menú y Wi-Fi."}
                  </p>
                </div>

                {/* URL Quick Copy Row */}
                <div className="space-y-2 text-xs">
                  {/* QR Link */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">
                        QR
                      </span>
                      <span className="font-mono text-slate-400 truncate">{qrUrl}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(qrUrl)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Copiar URL para QR"
                      >
                        {copiedUrl === qrUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Abrir URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* NFC Link */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
                        NFC
                      </span>
                      <span className="font-mono text-slate-400 truncate">{nfcUrl}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(nfcUrl)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Copiar URL para NFC"
                      >
                        {copiedUrl === nfcUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={nfcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Abrir URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Plate Mini Analytics Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>
                      Total: <strong className="text-white">{device.totalScans}</strong>
                    </span>
                    <span>
                      📷 QR: <strong className="text-amber-400">{device.qrScans}</strong>
                    </span>
                    <span>
                      📱 NFC: <strong className="text-indigo-400">{device.nfcScans}</strong>
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/qr/${device.id}`}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <span>Descargar QR</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim / Link Plate Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Vincular Nueva Placa Zelo</h3>
                <p className="text-xs text-slate-400">
                  Ingresa el código y el PIN de tu placa física.
                </p>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {claimError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {claimError}
              </div>
            )}

            <form onSubmit={handleClaimDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Placa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ZL-8F29KD"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  PIN de Activación
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingClaim}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {loadingClaim ? "Vinculando..." : "Vincular a mi Negocio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
