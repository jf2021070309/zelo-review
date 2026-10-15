"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Sparkles,
  ShieldCheck,
  MapPin,
} from "lucide-react";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  business?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
}

export default function DashboardNav({ user }: Props) {
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
      label: "Gestor de Placas (CRUD)",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Generador Google Reviews",
      href: "/dashboard/google-reviews",
      icon: MapPin,
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
              <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase">
                Administración
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Badge */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">Administrador Único</div>
            <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>

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
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate font-mono">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
