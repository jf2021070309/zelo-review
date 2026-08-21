import { prisma } from "@/lib/prisma";
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

export default async function AdminOverviewPage() {
  const totalDevices = await prisma.device.count();
  const activeDevices = await prisma.device.count({ where: { status: "ACTIVE" } });
  const readyDevices = await prisma.device.count({ where: { status: "READY_TO_ASSIGN" } });
  const totalBusinesses = await prisma.business.count();
  const totalScans = await prisma.scanEvent.count();
  const qrScans = await prisma.scanEvent.count({ where: { source: "QR" } });
  const nfcScans = await prisma.scanEvent.count({ where: { source: "NFC" } });

  const recentBatches = await prisma.batch.findMany({
    include: {
      _count: { select: { devices: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentBusinesses = await prisma.business.findMany({
    include: {
      user: true,
      _count: { select: { devices: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

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
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Generar Lote de Imprenta</span>
        </Link>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Devices */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Placas Producidas
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">{totalDevices}</div>
            <div className="text-xs text-slate-400">
              <span className="text-emerald-400 font-bold">{activeDevices} activas</span> •{" "}
              <span className="text-amber-400">{readyDevices} listas para asignar</span>
            </div>
          </div>
        </div>

        {/* Total Businesses */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Negocios Clientes
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">{totalBusinesses}</div>
            <div className="text-xs text-indigo-400 font-medium">Empresas registradas</div>
          </div>
        </div>

        {/* Global Scans */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Escaneos Globales
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">{totalScans}</div>
            <div className="text-xs text-slate-400">
              📷 QR: {qrScans} • 📱 NFC: {nfcScans}
            </div>
          </div>
        </div>

        {/* QR vs NFC Ratio */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Efectividad NFC
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-400">
              {totalScans > 0 ? Math.round((nfcScans / totalScans) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-400">Toques por chip de proximidad</div>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Batches & Recent Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Batches for Printing */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">Lotes de Imprenta Recientes</h2>
              <p className="text-xs text-slate-400">Archivos para corte láser y RIP UV</p>
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
