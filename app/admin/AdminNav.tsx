"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Printer,
  Smartphone,
  Building2,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

interface Props {
  user: {
    name: string;
    email: string;
  };
}

export default function AdminNav({ user }: Props) {
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
      label: "Métricas Globales",
      href: "/admin",
      icon: ShieldAlert,
    },
    {
      label: "Lotes & Imprenta UV",
      href: "/admin/batches",
      icon: Printer,
    },
    {
      label: "Todas las Placas",
      href: "/admin/devices",
      icon: Smartphone,
    },
    {
      label: "Negocios Clientes",
      href: "/admin/businesses",
      icon: Building2,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-950/90 border-b md:border-b-0 md:border-r border-amber-500/20 flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        {/* Brand */}
        <div className="space-y-1">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-tight">
                ZELO<span className="text-amber-400">.</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Super Administrador
              </span>
            </div>
          </Link>
        </div>

        {/* Switch back to Business Dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ir a Panel de Negocio</span>
        </Link>

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-amber-400/80 truncate">SuperAdmin</p>
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
