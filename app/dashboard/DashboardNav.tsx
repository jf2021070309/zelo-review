"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Smartphone,
  QrCode,
  Settings,
  LogOut,
  Building2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
}

export default function DashboardNav({ user, business }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navItems = [
    {
      label: "Métricas & Resumen",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Mis Placas Zelo",
      href: "/dashboard/devices",
      icon: Smartphone,
    },
    {
      label: "Estudio & Descarga QR",
      href: "/dashboard/qr",
      icon: QrCode,
    },
    {
      label: "Ajustes de Negocio",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 backdrop-blur-md">
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-tight">
                ZELO<span className="text-amber-400">.</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Panel Negocio
              </span>
            </div>
          </Link>
        </div>

        {/* Business Selector / Current Business Card */}
        {business && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
              {business.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">{business.name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>En Línea</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* SuperAdmin Link if applicable */}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all mt-4"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Panel SuperAdmin</span>
            </Link>
          )}
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
