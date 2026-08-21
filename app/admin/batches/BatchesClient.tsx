"use client";

import { useState } from "react";
import {
  Printer,
  Plus,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BatchItem {
  id: string;
  name: string;
  quantity: number;
  prefix: string;
  notes?: string | null;
  createdAt: string;
  deviceCount: number;
  sampleDevices: Array<{
    id: string;
    code: string;
    status: string;
    activationPin: string;
  }>;
}

interface Props {
  batches: BatchItem[];
}

export default function BatchesClient({ batches: initialBatches }: Props) {
  const [batches, setBatches] = useState(initialBatches);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(50);
  const [prefix, setPrefix] = useState("ZL");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          quantity: Number(quantity),
          prefix,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear lote.");

      setSuccess(`¡Lote creado exitosamente con ${data.generatedCount} placas listas para imprimir!`);
      setShowCreateModal(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Lotes de Producción & Imprenta UV
          </h1>
          <p className="text-sm text-slate-400">
            Genera identificadores únicos, PINs de activación y descarga los paquetes ZIP para el taller de impresión UV y grabado láser.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Generar Nuevo Lote</span>
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Batches List */}
      <div className="space-y-4">
        {batches.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center space-y-3">
            <Printer className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No hay lotes creados</h3>
            <p className="text-xs text-slate-400">Genera tu primer lote para exportar códigos a la imprenta.</p>
          </div>
        ) : (
          batches.map((batch) => (
            <div
              key={batch.id}
              className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold text-white">{batch.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {batch.deviceCount} placas
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Prefijo: <strong className="text-amber-400 font-mono">{batch.prefix}</strong> • Creado: {formatDate(batch.createdAt)}
                  </p>
                  {batch.notes && <p className="text-xs text-slate-500">{batch.notes}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/api/admin/batches/${batch.id}/export`}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar ZIP para Imprenta (QR + CSV)</span>
                  </a>
                </div>
              </div>

              {/* Sample Plates in this Batch */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Muestra de códigos generados en este lote:
                </span>
                <div className="flex flex-wrap gap-2">
                  {batch.sampleDevices.map((dev) => (
                    <div
                      key={dev.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2"
                    >
                      <span className="font-bold text-white">{dev.code}</span>
                      <span className="text-[10px] text-slate-500">PIN: {dev.activationPin}</span>
                    </div>
                  ))}
                  {batch.deviceCount > 5 && (
                    <span className="text-xs text-slate-500 self-center">
                      +{batch.deviceCount - 5} más en el archivo ZIP...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Generate Batch */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Generar Lote de Placas para Imprenta</h3>
                <p className="text-xs text-slate-400">
                  Crea automáticamente códigos únicos, PINs y archivos QR en alta resolución.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del Lote / Pedido de Impresión
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Lote UV-02 - 100 Placas Acrílicas Negras"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cantidad de Placas
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prefijo de Código
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="ZL"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas de Producción / Acabado (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Acrílico 10x15cm, fondo negro, grabado láser y tinta UV dorada..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {loading ? "Generando Códigos..." : "Crear y Generar Lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
