"use client";

import { useEffect, useState } from "react";
import { Users, Building2, Plus, Pencil, Trash2, Send, Loader2, MessageCircle, Mail, X, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

interface Manager {
  id: string;
  name: string;
  role: string | null;
  channel: "WHATSAPP" | "EMAIL" | "BOTH";
  whatsapp: string | null;
  email: string | null;
  isActive: boolean;
  businessId: string | null;
  branchCount: number;
  openCases: number;
}
interface Branch {
  id: string;
  name: string;
  address: string | null;
  googleReviewUrl: string | null;
  managerId: string | null;
  managerName: string | null;
  businessId: string | null;
  qrCount: number;
}
interface Business { id: string; name: string; googleReviewUrl: string | null }

const emptyManager = { name: "", role: "Gerente de sucursal", channel: "WHATSAPP" as Manager["channel"], whatsapp: "", email: "", isActive: true, businessId: "" };
const emptyBranch = { name: "", address: "", googleReviewUrl: "", managerId: "", businessId: "" };

export default function ManagersClient() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [providers, setProviders] = useState<{ whatsapp: boolean; email: boolean; n8n: boolean } | null>(null);
  const [mForm, setMForm] = useState<any | null>(null);
  const [bForm, setBForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const load = async () => {
    const [m, b] = await Promise.all([fetch("/api/managers", { cache: "no-store" }), fetch("/api/branches", { cache: "no-store" })]);
    const mj = await m.json();
    const bj = await b.json();
    if (m.ok) {
      setManagers(mj.managers);
      setProviders(mj.providers);
    }
    if (b.ok) {
      setBranches(bj.branches);
      setBusinesses(bj.businesses);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (kind: "manager" | "branch") => {
    const form = kind === "manager" ? mForm : bForm;
    setSaving(true);
    setError(null);
    try {
      const base = kind === "manager" ? "/api/managers" : "/api/branches";
      const res = await fetch(form.id ? `${base}/${form.id}` : base, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      kind === "manager" ? setMForm(null) : setBForm(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (kind: "manager" | "branch", id: string, label: string) => {
    if (!confirm(`¿Eliminar ${kind === "manager" ? "al gerente" : "la sucursal"} "${label}"?`)) return;
    const res = await fetch(`/api/${kind === "manager" ? "managers" : "branches"}/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) alert(json.error || "No se pudo eliminar");
    load();
  };

  const test = async (m: Manager) => {
    setTesting(m.id);
    try {
      const res = await fetch(`/api/managers/${m.id}/test`, { method: "POST" });
      const json = await res.json();
      setTestResult((t) => ({ ...t, [m.id]: res.ok ? json.results : [{ status: "FAILED", error: json.error }] }));
    } finally {
      setTesting(null);
    }
  };

  const assign = async (branchId: string, managerId: string) => {
    await fetch(`/api/branches/${branchId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ managerId: managerId || null }) });
    load();
  };

  const input = "w-full rounded-xl bg-slate-950/70 border border-slate-700 focus:border-indigo-500 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500";
  const label = "block text-xs font-semibold text-slate-400 mb-1.5";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-indigo-400" /> Gerentes y sucursales</h1>
        <p className="text-sm text-slate-400">Define quién recibe las alertas de reseñas negativas y por qué canal. Cada sucursal tiene un gerente responsable; cada QR de reseñas pertenece a una sucursal.</p>
      </div>

      {/* Estado de proveedores */}
      {providers && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { k: "whatsapp", t: "WhatsApp Business Platform", env: "WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID" },
            { k: "email", t: "Correo (Resend)", env: "RESEND_API_KEY + EMAIL_FROM" },
            { k: "n8n", t: "Webhook n8n", env: "N8N_WEBHOOK_URL" },
          ].map((p) => {
            const on = (providers as any)[p.k];
            return (
              <div key={p.k} className={`rounded-xl border p-3.5 text-xs ${on ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-700 bg-slate-900/60"}`}>
                <div className="flex items-center gap-2 font-semibold text-sm text-white">
                  {on ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />} {p.t}
                </div>
                <div className="text-slate-400 mt-1">{on ? "Conectado: los avisos se envían automáticamente." : <>Modo simulado: el aviso queda registrado con un botón para enviarlo a mano. Configura <code className="text-slate-300">{p.env}</code> en <code>.env</code>.</>}</div>
              </div>
            );
          })}
        </div>
      )}

      {error && <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2.5">{error}</div>}

      {/* GERENTES */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Gerentes ({managers.length})</div>
          <button onClick={() => { setError(null); setMForm({ ...emptyManager }); }} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> Nuevo gerente</button>
        </div>

        {mForm && (
          <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-4">
            <div className="flex items-center justify-between"><div className="font-semibold text-white">{mForm.id ? "Editar gerente" : "Nuevo gerente"}</div><button onClick={() => setMForm(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={label}>Nombre *</label><input className={input} value={mForm.name} onChange={(e) => setMForm({ ...mForm, name: e.target.value })} placeholder="Ana Torres" /></div>
              <div><label className={label}>Cargo</label><input className={input} value={mForm.role || ""} onChange={(e) => setMForm({ ...mForm, role: e.target.value })} /></div>
              <div className="sm:col-span-2">
                <label className={label}>Canal de aviso *</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "WHATSAPP", t: "WhatsApp", I: MessageCircle },
                    { v: "EMAIL", t: "Correo", I: Mail },
                    { v: "BOTH", t: "WhatsApp + Correo", I: Send },
                  ].map(({ v, t, I }) => (
                    <button key={v} type="button" onClick={() => setMForm({ ...mForm, channel: v })} className={`px-4 py-2 rounded-xl border text-sm flex items-center gap-2 ${mForm.channel === v ? "border-emerald-400 bg-emerald-500/10 text-emerald-300" : "border-slate-700 text-slate-300"}`}>
                      <I className="w-4 h-4" /> {t}
                    </button>
                  ))}
                </div>
              </div>
              {(mForm.channel === "WHATSAPP" || mForm.channel === "BOTH") && (
                <div><label className={label}>WhatsApp (con código de país) *</label><input className={input} value={mForm.whatsapp || ""} onChange={(e) => setMForm({ ...mForm, whatsapp: e.target.value })} placeholder="51987654321" inputMode="tel" /></div>
              )}
              {(mForm.channel === "EMAIL" || mForm.channel === "BOTH") && (
                <div><label className={label}>Correo *</label><input className={input} value={mForm.email || ""} onChange={(e) => setMForm({ ...mForm, email: e.target.value })} placeholder="gerente@negocio.com" inputMode="email" /></div>
              )}
              <div>
                <label className={label}>Negocio</label>
                <select className={input} value={mForm.businessId || ""} onChange={(e) => setMForm({ ...mForm, businessId: e.target.value })}>
                  <option value="">— Ninguno —</option>
                  {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 self-end h-[42px]"><input type="checkbox" checked={mForm.isActive} onChange={(e) => setMForm({ ...mForm, isActive: e.target.checked })} className="accent-indigo-500 w-4 h-4" /> Activo (recibe alertas)</label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setMForm(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300">Cancelar</button>
              <button onClick={() => submit("manager")} disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar</button>
            </div>
          </div>
        )}

        {managers.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Crea tu primer gerente.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {managers.map((m) => (
              <div key={m.id} className={`rounded-2xl border p-4 space-y-3 ${m.isActive ? "border-slate-700 bg-slate-950/50" : "border-slate-800 bg-slate-950/20 opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">{m.name.slice(0, 1).toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{m.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{m.role || "Gerente"}{!m.isActive && " · inactivo"}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button title="Editar" onClick={() => { setError(null); setMForm({ ...m, businessId: m.businessId || "" }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                    <button title="Eliminar" onClick={() => del("manager", m.id, m.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {(m.channel === "WHATSAPP" || m.channel === "BOTH") && <div className="flex items-center gap-2 text-emerald-300"><MessageCircle className="w-3.5 h-3.5" /> {m.whatsapp}</div>}
                  {(m.channel === "EMAIL" || m.channel === "BOTH") && <div className="flex items-center gap-2 text-sky-300"><Mail className="w-3.5 h-3.5" /> {m.email}</div>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{m.branchCount} sucursal(es)</span>
                  <span className={m.openCases > 0 ? "text-rose-300 font-semibold" : ""}>{m.openCases} caso(s) abiertos</span>
                </div>
                <button onClick={() => test(m)} disabled={testing === m.id || !m.isActive} className="w-full py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-center gap-2 disabled:opacity-50">
                  {testing === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Enviar aviso de prueba
                </button>
                {testResult[m.id] && (
                  <div className="space-y-1">
                    {testResult[m.id].map((r: any, i: number) => (
                      <div key={i} className="text-[11px] flex flex-wrap items-center gap-2">
                        <span className={r.status === "SENT" ? "text-emerald-300" : r.status === "FAILED" ? "text-rose-300" : "text-amber-300"}>
                          {r.channel || ""} {r.status === "SIMULATED" ? "simulado" : r.status === "SENT" ? "enviado ✓" : "falló"}
                        </span>
                        {r.error && <span className="text-rose-300 break-all">{r.error}</span>}
                        {r.status !== "SENT" && r.deliveryUrl && <a href={r.deliveryUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline flex items-center gap-1">abrir y enviar <ExternalLink className="w-3 h-3" /></a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SUCURSALES */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-400" /> Directorio de sucursales → gerente ({branches.length})</div>
          <button onClick={() => { setError(null); setBForm({ ...emptyBranch, managerId: managers[0]?.id || "" }); }} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> Nueva sucursal</button>
        </div>

        {bForm && (
          <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-4">
            <div className="flex items-center justify-between"><div className="font-semibold text-white">{bForm.id ? "Editar sucursal" : "Nueva sucursal"}</div><button onClick={() => setBForm(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={label}>Nombre *</label><input className={input} value={bForm.name} onChange={(e) => setBForm({ ...bForm, name: e.target.value })} placeholder="Sucursal Miraflores" /></div>
              <div><label className={label}>Dirección</label><input className={input} value={bForm.address || ""} onChange={(e) => setBForm({ ...bForm, address: e.target.value })} /></div>
              <div>
                <label className={label}>Gerente responsable</label>
                <select className={input} value={bForm.managerId || ""} onChange={(e) => setBForm({ ...bForm, managerId: e.target.value })}>
                  <option value="">— Sin gerente (no se avisará) —</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.channel === "BOTH" ? "WhatsApp + correo" : m.channel === "EMAIL" ? "correo" : "WhatsApp"}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Negocio</label>
                <select className={input} value={bForm.businessId || ""} onChange={(e) => {
                  const biz = businesses.find((b) => b.id === e.target.value);
                  setBForm({ ...bForm, businessId: e.target.value, googleReviewUrl: bForm.googleReviewUrl || biz?.googleReviewUrl || "" });
                }}>
                  <option value="">— Ninguno —</option>
                  {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Enlace directo de reseña de Google (de esta sucursal)</label>
                <input className={input} value={bForm.googleReviewUrl || ""} onChange={(e) => setBForm({ ...bForm, googleReviewUrl: e.target.value })} placeholder="https://search.google.com/local/writereview?placeid=…" />
                <p className="text-[11px] text-slate-500 mt-1">Se obtiene gratis desde tu Perfil de Empresa de Google → “Pedir reseñas”.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setBForm(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300">Cancelar</button>
              <button onClick={() => submit("branch")} disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar</button>
            </div>
          </div>
        )}

        {branches.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Aún no hay sucursales.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/60">
                <tr><th className="text-left px-5 py-3">Sucursal</th><th className="text-left px-5 py-3">Gerente que recibe la alerta</th><th className="text-left px-5 py-3">Google</th><th className="text-center px-5 py-3">QR</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3"><div className="font-semibold text-white">{b.name}</div><div className="text-[11px] text-slate-500">{b.address || "—"}</div></td>
                    <td className="px-5 py-3">
                      <select value={b.managerId || ""} onChange={(e) => assign(b.id, e.target.value)} className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-white">
                        <option value="">⚠ Sin gerente</option>
                        {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-xs">{b.googleReviewUrl ? <a href={b.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:underline flex items-center gap-1">Configurado <ExternalLink className="w-3 h-3" /></a> : <span className="text-amber-300">Falta enlace</span>}</td>
                    <td className="px-5 py-3 text-center">{b.qrCount}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button title="Editar" onClick={() => { setError(null); setBForm({ ...b, managerId: b.managerId || "", businessId: b.businessId || "" }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                      <button title="Eliminar" onClick={() => del("branch", b.id, b.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
