"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  Layers,
  Palette,
  ExternalLink,
  Printer,
} from "lucide-react";

interface DeviceItem {
  id: string;
  code: string;
  status: string;
  mode: string;
}

interface Props {
  devices: DeviceItem[];
  initialDeviceId?: string;
  businessName: string;
}

export default function QrStudioClient({
  devices,
  initialDeviceId,
  businessName,
}: Props) {
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    initialDeviceId || (devices[0]?.id ?? "")
  );
  const [sourceType, setSourceType] = useState<"qr" | "nfc">("qr");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  const targetUrl = selectedDevice
    ? typeof window !== "undefined"
      ? `${window.location.origin}/r/${selectedDevice.code}?src=${sourceType}`
      : `https://zelo.pe/r/${selectedDevice.code}?src=${sourceType}`
    : "";

  // Generate QR on parameter change
  useEffect(() => {
    if (!targetUrl) return;

    QRCode.toDataURL(targetUrl, {
      width: 1000,
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [targetUrl, darkColor, lightColor]);

  const handleDownloadPng = (resolution = 1000) => {
    if (!targetUrl || !selectedDevice) return;

    QRCode.toDataURL(targetUrl, {
      width: resolution,
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: "H",
    }).then((url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `ZELO_${selectedDevice.code}_QR_${resolution}px.png`;
      a.click();
    });
  };

  const handleDownloadSvg = async () => {
    if (!targetUrl || !selectedDevice) return;

    try {
      const svg = await QRCode.toString(targetUrl, {
        type: "svg",
        width: 1000,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: "H",
      });

      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ZELO_${selectedDevice.code}_Vector.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading SVG:", err);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Estudio & Descarga de Códigos QR
        </h1>
        <p className="text-sm text-slate-400">
          Genera códigos QR de alta resolución (PNG 300 DPI y SVG vectorial) listos para impresión física o reemplazo de adhesivos.
        </p>
      </div>

      {devices.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl text-center space-y-3">
          <p className="text-sm text-slate-400">Primero vincula una placa para generar su código QR.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Device Selector Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Seleccionar Placa
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    Placa {d.code} ({d.mode === "SMART_PROFILE" ? "Smart Hub" : "Directo"})
                  </option>
                ))}
              </select>

              {/* URL Display */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  URL Codificada en el QR
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-amber-400 truncate">{targetUrl}</span>
                  <button
                    onClick={copyUrl}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Customization Options */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-400" />
                <span>Personalización del QR</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Color del Código</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-white">{darkColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Color de Fondo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-white">{lightColor}</span>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="pt-2">
                <span className="text-xs text-slate-400 block mb-2">Paletas Rápidas:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setDarkColor("#000000");
                      setLightColor("#ffffff");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white text-slate-950 font-bold text-xs border border-slate-300"
                  >
                    Clásico (Negro/Blanco)
                  </button>
                  <button
                    onClick={() => {
                      setDarkColor("#4f46e5");
                      setLightColor("#ffffff");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs"
                  >
                    Índigo Zelo
                  </button>
                  <button
                    onClick={() => {
                      setDarkColor("#f59e0b");
                      setLightColor("#090d16");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 font-bold text-xs border border-amber-500/30"
                  >
                    Gold Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Opciones de Exportación</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownloadPng(1000)}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>PNG Alta Resolución (1000px)</span>
                </button>

                <button
                  onClick={() => handleDownloadPng(2400)}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>PNG Imprenta 300DPI (2400px)</span>
                </button>

                <button
                  onClick={handleDownloadSvg}
                  className="sm:col-span-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  <Layers className="w-4 h-4" />
                  <span>Descargar Vector SVG (Corte Láser / RIP UV)</span>
                </button>
              </div>
            </div>
          </div>

          {/* QR & Plaque Print Preview (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Vista Previa de Placa Acrílica Zelo
            </span>

            {/* Simulated Acrylic Physical Plate */}
            <div className="w-full max-w-sm mx-auto p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0B101E] to-slate-950 border-2 border-slate-700/80 shadow-2xl shadow-black relative overflow-hidden text-center space-y-5">
              {/* Glass Acrylic Sheen Line */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-3xl" />

              {/* Plaque Header */}
              <div className="space-y-1 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center mx-auto shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-black tracking-tight text-white">{businessName}</h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  ⭐ Califícanos en Google Reviews
                </p>
              </div>

              {/* Center QR Box */}
              <div className="p-3 bg-white rounded-2xl inline-block shadow-xl border border-slate-200/40 relative z-10">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Código QR ${selectedDevice?.code}`}
                    className="w-48 h-48 rounded-xl object-contain mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-xl" />
                )}
              </div>

              {/* NFC & QR Instructions on Plaque */}
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Acerca tu teléfono o escanea el QR</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  ID: {selectedDevice?.code}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
