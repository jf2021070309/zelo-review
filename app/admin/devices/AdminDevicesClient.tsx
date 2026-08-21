"use client";

import { useState } from "react";
import {
  Smartphone,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DeviceItem {
  id: string;
  code: string;
  activationPin: string;
  status: string;
  mode: string;
  businessName?: string | null;
  batchName?: string | null;
  totalScans: number;
  createdAt: string;
}

interface Props {
  devices: DeviceItem[];
}

export default function AdminDevicesClient({ devices }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filtered = devices.filter((d) => {
    const matchesSearch =
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      d.activationPin.includes(search);

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Todas las Placas del Sistema
        </h1>
        <p className="text-sm text-slate-400">
          Registro maestro de placas, asignaciones a comercios y estados de activación.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código (ZL-XXXX), PIN o nombre de negocio..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="ACTIVE">Activas</option>
          <option value="READY_TO_ASSIGN">Sin Asignar / En Fábrica</option>
          <option value="SUSPENDED">Suspendidas</option>
        </select>
      </div>

      {/* Master Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Código Placa</th>
                <th className="py-3.5 px-4">PIN Activación</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Negocio Asignado</th>
                <th className="py-3.5 px-4">Modo</th>
                <th className="py-3.5 px-4">Escaneos</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No se encontraron placas con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                      <span>{d.code}</span>
                      <button
                        onClick={() => handleCopy(d.code)}
                        className="text-slate-500 hover:text-white transition"
                      >
                        {copiedCode === d.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {d.activationPin}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {d.businessName || (
                        <span className="text-slate-500 italic">Sin asignar (Lista para cliente)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {d.mode === "SMART_PROFILE" ? "Smart Bio-Hub" : "Directo 302"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {d.totalScans}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`/r/${d.code}?src=qr`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
