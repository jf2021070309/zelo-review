import { query, queryOne } from "@/lib/db";
import Link from "next/link";
import {
  Smartphone,
  Building2,
  Printer,
  Eye,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Download,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const counts = await queryOne<any>(`
    SELECT
      (SELECT COUNT(*) FROM devices) AS totalDevices,
      (SELECT COUNT(*) FROM devices WHERE status = 'ACTIVE') AS activeDevices,
      (SELECT COUNT(*) FROM devices WHERE status = 'READY_TO_ASSIGN') AS readyDevices,
      (SELECT COUNT(*) FROM businesses) AS totalBusinesses,
      (SELECT COUNT(*) FROM scan_events) AS totalScans,
      (SELECT COUNT(*) FROM scan_events WHERE source = 'QR') AS qrScans,
      (SELECT COUNT(*) FROM scan_events WHERE source = 'NFC') AS nfcScans
  `);

  const totalDevices = Number(counts?.totalDevices || 0);
  const activeDevices = Number(counts?.activeDevices || 0);
  const readyDevices = Number(counts?.readyDevices || 0);
  const totalBusinesses = Number(counts?.totalBusinesses || 0);
  const totalScans = Number(counts?.totalScans || 0);
  const qrScans = Number(counts?.qrScans || 0);
  const nfcScans = Number(counts?.nfcScans || 0);

  const batchesRows = await query<any>(`
    SELECT b.*, COUNT(d.id) AS deviceCount
    FROM batches b
    LEFT JOIN devices d ON d.batchId = b.id
    GROUP BY b.id
    ORDER BY b.createdAt DESC
    LIMIT 5
  `);

  const recentBatches = batchesRows.map((b) => ({
    ...b,
    _count: { devices: Number(b.deviceCount || 0) },
  }));

  const businessesRows = await query<any>(`
    SELECT b.*, u.email AS userEmail, COUNT(d.id) AS deviceCount
    FROM businesses b
    LEFT JOIN users u ON b.userId = u.id
    LEFT JOIN devices d ON d.businessId = b.id
    GROUP BY b.id, u.id
    ORDER BY b.createdAt DESC
    LIMIT 5
  `);

  const recentBusinesses = businessesRows.map((biz) => ({
    ...biz,
    user: { email: biz.userEmail || "admin@zelo.pe" },
    _count: { devices: Number(biz.deviceCount || 0) },
  }));

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/30 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Centro de Operaciones Global</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Panel Master ZELO Review
          </h1>
          <p className="text-sm text-slate-400">
            Control de producción en imprenta, distribución de placas y analítica global de clientes.
          </p>
        </div>

        <Link
          href="/admin/batches"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Generar Lote de Producción</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Placas Fabricadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{totalDevices}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{activeDevices} activas</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{readyDevices} por asignar</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Comercios Afiliados
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{totalBusinesses}</div>
            <p className="text-xs text-slate-400 mt-1">
              Negocios administrando placas
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Impactos Totales
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{totalScans}</div>
            <p className="text-xs text-slate-400 mt-1">
              Escaneos y toques registrados
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Canal Dominante
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white flex items-baseline gap-2">
              <span>{qrScans >= nfcScans ? "QR" : "NFC"}</span>
              <span className="text-xs text-slate-400 font-normal">
                ({qrScans} QR vs {nfcScans} NFC)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Desglose de tecnología usada
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Batches & Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">Últimos Lotes Creados</h2>
              <p className="text-xs text-slate-400">Archivos para corte láser e imprenta UV</p>
            </div>
            <Link
              href="/admin/batches"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentBatches.map((batch) => (
              <div
                key={batch.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-sm">{batch.name}</div>
                  <div className="text-xs text-slate-400">
                    {batch._count.devices} placas • Prefijo: <span className="font-mono text-amber-400">{batch.prefix}</span>
                  </div>
                </div>
                <a
                  href={`/api/admin/batches/${batch.id}/export`}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ZIP Imprenta</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Businesses */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">Negocios Registrados</h2>
              <p className="text-xs text-slate-400">Comercios usando Zelo Review</p>
            </div>
            <Link
              href="/admin/businesses"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentBusinesses.map((biz) => (
              <div
                key={biz.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-sm">{biz.name}</div>
                  <div className="text-xs text-slate-400">
                    {biz.user.email} • {biz._count.devices} placas activas
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {biz.category || "General"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
