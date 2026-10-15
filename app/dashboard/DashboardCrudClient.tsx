"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Smartphone,
  QrCode,
  Sparkles,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Trash2,
  Globe,
  Instagram,
  MessageCircle,
  Star,
  Search,
  Filter,
  Download,
  AlertCircle,
  Eye,
  Sliders,
  CheckCircle2,
  X,
  Zap,
  BarChart3,
  Building2,
  Lock,
  MapPin,
} from "lucide-react";

interface SmartProfile {
  id: string;
  title?: string | null;
  description?: string | null;
  googleReviewUrl?: string | null;
  googleReviewEnabled: boolean;
  facebookUrl?: string | null;
  facebookEnabled: boolean;
  instagramHandle?: string | null;
  instagramEnabled: boolean;
  websiteUrl?: string | null;
  websiteEnabled: boolean;
  whatsappNumber?: string | null;
  whatsappEnabled: boolean;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
}

interface Device {
  id: string;
  code: string;
  activationPin: string;
  status: "ACTIVE" | "SUSPENDED" | "READY_TO_ASSIGN" | "IN_PRODUCTION";
  mode: "DIRECT_REDIRECT" | "SMART_PROFILE";
  customDestinationUrl?: string | null;
  businessId?: string | null;
  business?: Business | null;
  smartProfile?: SmartProfile | null;
  totalScans: number;
  qrScans: number;
  nfcScans: number;
  createdAt: string;
}

interface Props {
  initialDevices: Device[];
  businesses: Business[];
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function DashboardCrudClient({
  initialDevices,
  businesses: initialBusinesses,
  user,
}: Props) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<string>("ALL");
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Estado Modal Crear / Generar
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Campos Form Crear / Generar
  const [businessSelection, setBusinessSelection] = useState<string>("new"); // "new" o business.id
  const [formBusinessName, setFormBusinessName] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formFacebook, setFormFacebook] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formGoogleReviews, setFormGoogleReviews] = useState("");
  const [formMode, setFormMode] = useState<"DIRECT_REDIRECT" | "SMART_PROFILE">("SMART_PROFILE");
  const [formStaticDestination, setFormStaticDestination] = useState<string>("google");
  const [formCustomUrl, setFormCustomUrl] = useState("");

  // Estado Modal Éxito / Ver QR Generado
  const [createdDeviceResult, setCreatedDeviceResult] = useState<{
    code: string;
    pin: string;
    mode: string;
    qrUrl: string;
    nfcUrl: string;
    businessName: string;
  } | null>(null);

  // Estado Modal Editar (Update)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editGoogleReviews, setEditGoogleReviews] = useState("");
  const [editMode, setEditMode] = useState<"DIRECT_REDIRECT" | "SMART_PROFILE">("SMART_PROFILE");
  const [editCustomUrl, setEditCustomUrl] = useState("");

  // Estado Modal Ver / Descargar QR
  const [qrModalDevice, setQrModalDevice] = useState<Device | null>(null);

  // Estado Modal Eliminar (Delete)
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper Place ID en Modal Crear
  const [showPlaceIdHelper, setShowPlaceIdHelper] = useState(false);
  const [inlinePlaceId, setInlinePlaceId] = useState("");

  // Helper Place ID en Modal Editar
  const [showEditPlaceIdHelper, setShowEditPlaceIdHelper] = useState(false);
  const [inlineEditPlaceId, setInlineEditPlaceId] = useState("");

  // Abrir modal de creación automáticamente si viene de la herramienta Google Reviews
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("newPlate") === "1") {
        setShowCreateModal(true);
        const gUrl = params.get("googleUrl");
        if (gUrl) {
          setFormGoogleReviews(decodeURIComponent(gUrl));
        }
        const bName = params.get("businessName");
        if (bName) {
          setFormBusinessName(decodeURIComponent(bName));
          setBusinessSelection("new");
        }
      }
    }
  }, []);

  const applyInlinePlaceId = () => {
    const raw = inlinePlaceId.trim();
    if (!raw) return;
    const match = raw.match(/[?&]place(?:_)?id=([A-Za-z0-9_-]+)/i);
    const id = match && match[1] ? match[1] : raw;
    setFormGoogleReviews(`https://search.google.com/local/writereview?placeid=${id}`);
    setShowPlaceIdHelper(false);
    setInlinePlaceId("");
  };

  const applyInlineEditPlaceId = () => {
    const raw = inlineEditPlaceId.trim();
    if (!raw) return;
    const match = raw.match(/[?&]place(?:_)?id=([A-Za-z0-9_-]+)/i);
    const id = match && match[1] ? match[1] : raw;
    setEditGoogleReviews(`https://search.google.com/local/writereview?placeid=${id}`);
    setShowEditPlaceIdHelper(false);
    setInlineEditPlaceId("");
  };

  // Copiado temporal
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const getFullUrl = (code: string, src: "qr" | "nfc") => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      if (!origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.includes(":3000")) {
        return `${origin}/r/${code}?src=${src}`;
      }
    }
    return `https://review.zelo.com.mx/r/${code}?src=${src}`;
  };

  // Manejar cambio en Combobox de negocio en modal de creación
  const handleBusinessSelectionChange = (val: string) => {
    setBusinessSelection(val);
    if (val === "new") {
      setFormBusinessName("");
      setFormWebsite("");
      setFormFacebook("");
      setFormInstagram("");
      setFormWhatsapp("");
      setFormGoogleReviews("");
    } else {
      const b = businesses.find((item) => item.id === val);
      if (b) {
        setFormBusinessName(b.name);
        setFormWebsite(b.website || "");
        setFormFacebook(b.facebook || "");
        setFormInstagram(b.instagram || "");
        setFormWhatsapp(b.whatsapp || "");
        setFormGoogleReviews(b.googleReviewUrl || "");
      }
    }
  };

  // Crear / Generar nueva placa
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload = {
        businessName: formBusinessName,
        existingBusinessId: businessSelection === "new" ? null : businessSelection,
        mode: formMode,
        staticDestinationType: formStaticDestination,
        customDestinationUrl: formCustomUrl,
        website: formWebsite,
        facebook: formFacebook,
        instagram: formInstagram,
        whatsapp: formWhatsapp,
        googleReviewUrl: formGoogleReviews,
      };

      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la placa.");

      // Actualizar lista de placas localmente
      const newDev: Device = {
        ...data.device,
        totalScans: 0,
        qrScans: 0,
        nfcScans: 0,
      };

      setDevices((prev) => [newDev, ...prev]);

      // Si se creó un nuevo negocio, agregarlo a la lista de negocios
      if (data.device.business && !businesses.some((b) => b.id === data.device.business.id)) {
        setBusinesses((prev) => [...prev, data.device.business]);
      }

      setShowCreateModal(false);

      // Mostrar modal de éxito con el QR generado
      setCreatedDeviceResult({
        code: data.device.code,
        pin: data.device.activationPin,
        mode: data.device.mode,
        qrUrl: getFullUrl(data.device.code, "qr"),
        nfcUrl: getFullUrl(data.device.code, "nfc"),
        businessName: data.device.business?.name || formBusinessName,
      });

      // Reset form
      setFormBusinessName("");
      setFormWebsite("");
      setFormFacebook("");
      setFormInstagram("");
      setFormWhatsapp("");
      setFormGoogleReviews("");
      setFormCustomUrl("");
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Abrir Modal de Edición (Update)
  const openEditModal = (dev: Device) => {
    setEditingDevice(dev);
    setEditError(null);
    setEditBusinessName(dev.business?.name || "");
    setEditWebsite(dev.smartProfile?.websiteUrl || dev.business?.website || "");
    setEditFacebook(dev.smartProfile?.facebookUrl || dev.business?.facebook || "");
    setEditInstagram(dev.smartProfile?.instagramHandle || dev.business?.instagram || "");
    setEditWhatsapp(dev.smartProfile?.whatsappNumber || dev.business?.whatsapp || "");
    setEditGoogleReviews(dev.smartProfile?.googleReviewUrl || dev.business?.googleReviewUrl || "");
    setEditMode(dev.mode);
    setEditCustomUrl(dev.customDestinationUrl || "");
  };

  // Guardar Edición (Update)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const payload = {
        businessName: editBusinessName,
        mode: editMode,
        customDestinationUrl: editCustomUrl || null,
        website: editWebsite,
        facebook: editFacebook,
        instagram: editInstagram,
        whatsapp: editWhatsapp,
        googleReviewUrl: editGoogleReviews,
      };

      const res = await fetch(`/api/devices/${editingDevice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar la placa.");

      // Actualizar estado local
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === editingDevice.id) {
            return {
              ...d,
              mode: editMode,
              customDestinationUrl: editCustomUrl || null,
              business: d.business
                ? {
                    ...d.business,
                    name: editBusinessName,
                    website: editWebsite,
                    facebook: editFacebook,
                    instagram: editInstagram,
                    whatsapp: editWhatsapp,
                    googleReviewUrl: editGoogleReviews,
                  }
                : null,
              smartProfile: d.smartProfile
                ? {
                    ...d.smartProfile,
                    title: editBusinessName,
                    websiteUrl: editWebsite,
                    facebookUrl: editFacebook,
                    instagramHandle: editInstagram,
                    whatsappNumber: editWhatsapp,
                    googleReviewUrl: editGoogleReviews,
                  }
                : null,
            };
          }
          return d;
        })
      );

      setEditingDevice(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Alternar Estado Activo / Suspendido
  const handleToggleStatus = async (dev: Device) => {
    const nextStatus = dev.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/devices/${dev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) => (d.id === dev.id ? { ...d, status: nextStatus } : d))
        );
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // Eliminar Placa (Delete)
  const handleDeleteDevice = async () => {
    if (!deletingDeviceId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/devices/${deletingDeviceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar la placa.");
      }

      setDevices((prev) => prev.filter((d) => d.id !== deletingDeviceId));
      setDeletingDeviceId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Dispositivos filtrados
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      // Búsqueda
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        dev.code.toLowerCase().includes(query) ||
        dev.business?.name.toLowerCase().includes(query) ||
        dev.activationPin.includes(query);

      // Filtro por negocio
      const matchBusiness =
        selectedBusinessFilter === "ALL" || dev.businessId === selectedBusinessFilter;

      // Filtro por modo
      const matchMode =
        selectedModeFilter === "ALL" || dev.mode === selectedModeFilter;

      // Filtro por estado
      const matchStatus =
        selectedStatusFilter === "ALL" || dev.status === selectedStatusFilter;

      return matchSearch && matchBusiness && matchMode && matchStatus;
    });
  }, [devices, search, selectedBusinessFilter, selectedModeFilter, selectedStatusFilter]);

  // Métricas totales en tiempo real
  const totalStats = useMemo(() => {
    const total = devices.length;
    const active = devices.filter((d) => d.status === "ACTIVE").length;
    const totalQr = devices.reduce((acc, d) => acc + (d.qrScans || 0), 0);
    const totalNfc = devices.reduce((acc, d) => acc + (d.nfcScans || 0), 0);
    const totalScans = totalQr + totalNfc;

    return { total, active, totalQr, totalNfc, totalScans };
  }, [devices]);

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Stats Bar (100% Real MySQL Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Placas
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalStats.total}</span>
            <span className="text-xs text-emerald-400 font-medium">
              ({totalStats.active} activas)
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Escaneos
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalStats.totalScans}</span>
            <span className="text-xs text-slate-400">visitas registradas</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Escaneos QR
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalStats.totalQr}</span>
            <span className="text-xs text-slate-400">cámara</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toques NFC
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalStats.totalNfc}</span>
            <span className="text-xs text-slate-400">proximidad</span>
          </div>
        </div>
      </div>

      {/* Main Action Header & Filter Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Gestor de Placas NFC & QR
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CRUD MySQL
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Genera nuevas placas personalizadas, configura redes y gestiona tus enlaces dinámicos o estáticos.
            </p>
          </div>

          <button
            onClick={() => {
              setBusinessSelection("new");
              handleBusinessSelectionChange("new");
              setShowCreateModal(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Generar Nueva Placa</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa o negocio..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Combobox Dinámico de Negocios */}
          <div>
            <select
              value={selectedBusinessFilter}
              onChange={(e) => setSelectedBusinessFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">🏢 Todos los Negocios ({businesses.length})</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Combobox de Modo (Estático vs Dinámico) */}
          <div>
            <select
              value={selectedModeFilter}
              onChange={(e) => setSelectedModeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">⚙️ Todos los Modos</option>
              <option value="SMART_PROFILE">✨ Dinámico (Bio-Hub)</option>
              <option value="DIRECT_REDIRECT">⚡ Estático (Directo)</option>
            </select>
          </div>

          {/* Combobox de Estado */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">🔘 Todos los Estados</option>
              <option value="ACTIVE">🟢 Solo Activos</option>
              <option value="SUSPENDED">🔴 Solo Suspendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* CRUD TABLE (Read, Update, Delete) */}
      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Listado de Placas ({filteredDevices.length})
            </span>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-indigo-400 hover:underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>

        {filteredDevices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No se encontraron placas</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay placas registradas que coincidan con los filtros. Crea tu primera placa haciendo clic en "Generar Nueva Placa".
            </p>
            <button
              onClick={() => {
                setBusinessSelection("new");
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generar mi primera placa</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Código / PIN</th>
                  <th className="py-3.5 px-4">Negocio</th>
                  <th className="py-3.5 px-4">Modo de Redirección</th>
                  <th className="py-3.5 px-4">Enlaces Configurados</th>
                  <th className="py-3.5 px-4">Métricas Reales</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredDevices.map((dev) => {
                  const isSmart = dev.mode === "SMART_PROFILE";
                  const qrUrl = getFullUrl(dev.code, "qr");

                  return (
                    <tr
                      key={dev.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Código y PIN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded-md border border-slate-700 text-xs">
                            {dev.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(dev.code)}
                            title="Copiar código"
                            className="text-slate-500 hover:text-slate-300 transition"
                          >
                            {copiedText === dev.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                          <Lock className="w-2.5 h-2.5" />
                          <span>PIN: {dev.activationPin}</span>
                        </div>
                      </td>

                      {/* Negocio */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white truncate max-w-[180px]">
                          {dev.business?.name || "Sin Negocio Asignado"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {dev.business?.slug || "—"}
                        </div>
                      </td>

                      {/* Modo (Estático vs Dinámico) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isSmart ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>Dinámico (Bio-Hub)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Estático (Directo)</span>
                          </span>
                        )}
                      </td>

                      {/* Enlaces configurados */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {dev.smartProfile?.googleReviewUrl || dev.business?.googleReviewUrl ? (
                            <span title="Google Reviews activo" className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                              <Star className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                          {dev.smartProfile?.facebookUrl || dev.business?.facebook ? (
                            <span title="Facebook activo" className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                              <span className="font-bold text-[10px]">fb</span>
                            </span>
                          ) : null}
                          {dev.smartProfile?.instagramHandle || dev.business?.instagram ? (
                            <span title="Instagram activo" className="w-6 h-6 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center">
                              <Instagram className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                          {dev.smartProfile?.whatsappNumber || dev.business?.whatsapp ? (
                            <span title="WhatsApp activo" className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                          {dev.smartProfile?.websiteUrl || dev.business?.website ? (
                            <span title="Web activa" className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                              <Globe className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Métricas Reales */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-white">
                          {dev.totalScans} visitas
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-emerald-400">📷 {dev.qrScans} QR</span>
                          <span>•</span>
                          <span className="text-cyan-400">📱 {dev.nfcScans} NFC</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(dev)}
                          title="Clic para cambiar estado"
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition ${
                            dev.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                          }`}
                        >
                          {dev.status === "ACTIVE" ? "🟢 Activo" : "🔴 Suspendido"}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Probar Redirección */}
                          <a
                            href={`/r/${dev.code}?src=qr`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Probar redirección real"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>

                          {/* Ver / Descargar QR */}
                          <button
                            onClick={() => setQrModalDevice(dev)}
                            title="Ver y Descargar Código QR"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar (Update) */}
                          <button
                            onClick={() => openEditModal(dev)}
                            title="Editar placa y enlaces"
                            className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 hover:text-white transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar (Delete) */}
                          <button
                            onClick={() => setDeletingDeviceId(dev.id)}
                            title="Eliminar placa"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: GENERAR NUEVA PLACA (CREATE CON TODOS LOS PARÁMETROS) */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl border border-slate-800 bg-[#0A0E17] max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generador de Placas Zelo</span>
              </div>
              <h2 className="text-xl font-black text-white">Generar Nueva Placa QR + NFC</h2>
              <p className="text-xs text-slate-400">
                Ingresa el nombre del negocio y los enlaces adicionales (web, facebook, instagram, etc.).
              </p>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Combobox Dinámico de Selección de Negocio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  1. Selección de Negocio (Combobox Dinámico)
                </label>
                <select
                  value={businessSelection}
                  onChange={(e) => handleBusinessSelectionChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="new">➕ Crear un Negocio Nuevo</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 Usar Negocio Existente: {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre del Negocio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nombre del Negocio <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formBusinessName}
                  onChange={(e) => setFormBusinessName(e.target.value)}
                  placeholder="Ej: Fuego Criollo Resto-Bar"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  El código de la placa se generará automáticamente a partir de este nombre (ej: <code>ZL-{formBusinessName.slice(0, 4).toUpperCase() || "NAME"}-XXXX</code>).
                </span>
              </div>

              {/* Enlaces Adicionales */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Parámetros Adicionales (Página, Redes, Contacto)
                </label>

                {/* Google Reviews */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enlace Google Reviews</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPlaceIdHelper(!showPlaceIdHelper)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{showPlaceIdHelper ? "Cerrar Place ID" : "⚡ Usar Place ID Finder"}</span>
                    </button>
                  </div>

                  {showPlaceIdHelper && (
                    <div className="mb-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-300">Convertir Google Place ID en enlace 5 estrellas:</span>
                        <a
                          href="/dashboard/google-reviews"
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Herramienta completa</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={inlinePlaceId}
                          onChange={(e) => setInlinePlaceId(e.target.value)}
                          placeholder="Pega Place ID (ej. ChIJ...) o link de Maps"
                          className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-amber-500/30 rounded text-white text-xs font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={applyInlinePlaceId}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    type="url"
                    value={formGoogleReviews}
                    onChange={(e) => setFormGoogleReviews(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Facebook */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <span className="text-blue-400 font-bold text-xs">fb</span>
                      <span>Facebook</span>
                    </div>
                    <input
                      type="text"
                      value={formFacebook}
                      onChange={(e) => setFormFacebook(e.target.value)}
                      placeholder="https://facebook.com/tunegocio"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instagram</span>
                    </div>
                    <input
                      type="text"
                      value={formInstagram}
                      onChange={(e) => setFormInstagram(e.target.value)}
                      placeholder="@tunegocio o https://instagram.com/..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Página Web */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Página Web Oficial</span>
                    </div>
                    <input
                      type="url"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      placeholder="https://tunegocio.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </div>
                    <input
                      type="text"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      placeholder="Ej: +51 987654321"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Combobox de Modo (Estático vs Dinámico) */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Tipo de Redirección (Combobox Estático / Dinámico)
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormMode("SMART_PROFILE")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formMode === "SMART_PROFILE"
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-indigo-300">Modo Dinámico</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        Bio-Hub con todos tus enlaces activos (Google, FB, IG, WA, Web).
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMode("DIRECT_REDIRECT")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formMode === "DIRECT_REDIRECT"
                        ? "bg-amber-500/20 border-amber-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-amber-300">Modo Estático</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        Redirección directa 1 a 1 sin pasar por menú intermedio.
                      </div>
                    </div>
                  </button>
                </div>

                {/* Sub-Combobox si es Modo Estático */}
                {formMode === "DIRECT_REDIRECT" && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      ¿A qué destino redirigirá directamente al escanear?
                    </label>
                    <select
                      value={formStaticDestination}
                      onChange={(e) => setFormStaticDestination(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-amber-500/30 rounded-lg text-white text-xs focus:outline-none"
                    >
                      <option value="google">⭐ Enlace de Google Reviews</option>
                      <option value="facebook">📘 Enlace de Facebook</option>
                      <option value="instagram">📸 Enlace de Instagram</option>
                      <option value="website">🌐 Página Web Oficial</option>
                      <option value="whatsapp">💬 Chat directo de WhatsApp</option>
                      <option value="custom">🔗 URL Personalizada...</option>
                    </select>

                    {formStaticDestination === "custom" && (
                      <input
                        type="url"
                        required
                        value={formCustomUrl}
                        onChange={(e) => setFormCustomUrl(e.target.value)}
                        placeholder="https://ejemplo.com/tu-destino"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {createLoading ? (
                    <span>Generando en MySQL...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generar Placa y Códigos</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: CONFIRMACIÓN Y VISTA DE QR RECIÉN GENERADO */}
      {/* ===================================================================== */}
      {createdDeviceResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl border border-slate-800 bg-[#0A0E17] max-w-md w-full p-6 space-y-5 text-center shadow-2xl relative">
            <button
              onClick={() => setCreatedDeviceResult(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">¡Placa Generada con Éxito!</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Guardada en MySQL para <strong>{createdDeviceResult.businessName}</strong>
              </p>
            </div>

            {/* QR Image Preview */}
            <div className="p-4 bg-white rounded-2xl max-w-[220px] mx-auto shadow-inner flex items-center justify-center">
              <img
                src={`/api/qr?text=${encodeURIComponent(createdDeviceResult.qrUrl)}&format=png`}
                alt="Código QR"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Código y PIN */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-around text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">CÓDIGO PLACA</span>
                <span className="font-mono font-bold text-white text-sm">
                  {createdDeviceResult.code}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px]">PIN SEGURIDAD</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {createdDeviceResult.pin}
                </span>
              </div>
            </div>

            {/* Enlaces de prueba y copia */}
            <div className="space-y-2 text-left text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-emerald-400 font-bold block">📷 URL PARA QR:</span>
                  <span className="text-[11px] text-slate-300 font-mono truncate block">
                    {createdDeviceResult.qrUrl}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(createdDeviceResult.qrUrl)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] flex-shrink-0"
                >
                  {copiedText === createdDeviceResult.qrUrl ? "¡Copiado!" : "Copiar"}
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-cyan-400 font-bold block">📱 URL PARA CHIP NFC:</span>
                  <span className="text-[11px] text-slate-300 font-mono truncate block">
                    {createdDeviceResult.nfcUrl}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(createdDeviceResult.nfcUrl)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] flex-shrink-0"
                >
                  {copiedText === createdDeviceResult.nfcUrl ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Botones de descarga */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={`/api/qr?text=${encodeURIComponent(createdDeviceResult.qrUrl)}&format=png&code=${createdDeviceResult.code}&download=1`}
                download
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PNG</span>
              </a>
              <a
                href={`/api/qr?text=${encodeURIComponent(createdDeviceResult.qrUrl)}&format=svg&code=${createdDeviceResult.code}&download=1`}
                download
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Vector SVG</span>
              </a>
            </div>

            <button
              onClick={() => setCreatedDeviceResult(null)}
              className="w-full py-2 text-xs text-slate-400 hover:text-white"
            >
              Cerrar y volver a la lista
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: EDITAR PLACA (UPDATE) */}
      {/* ===================================================================== */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl border border-slate-800 bg-[#0A0E17] max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setEditingDevice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {editingDevice.code}
              </span>
              <h2 className="text-xl font-black text-white mt-2">Editar Configuración de Placa</h2>
              <p className="text-xs text-slate-400">
                Los cambios se aplican al instante sin necesidad de cambiar el QR impreso.
              </p>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  required
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modo de Redirección */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Modo de Redirección (Estático vs Dinámico)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode("SMART_PROFILE")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      editMode === "SMART_PROFILE"
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dinámico (Bio-Hub)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode("DIRECT_REDIRECT")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      editMode === "DIRECT_REDIRECT"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Estático (Directo)</span>
                  </button>
                </div>
              </div>

              {editMode === "DIRECT_REDIRECT" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    URL de Redirección Directa
                  </label>
                  <input
                    type="url"
                    value={editCustomUrl}
                    onChange={(e) => setEditCustomUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?..."
                    className="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-lg text-white text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Redes y Destinos */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Enlaces del Perfil
                </label>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Google Reviews:</span>
                    <button
                      type="button"
                      onClick={() => setShowEditPlaceIdHelper(!showEditPlaceIdHelper)}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{showEditPlaceIdHelper ? "Cerrar" : "⚡ Place ID"}</span>
                    </button>
                  </div>

                  {showEditPlaceIdHelper && (
                    <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={inlineEditPlaceId}
                          onChange={(e) => setInlineEditPlaceId(e.target.value)}
                          placeholder="Pega Place ID (ChIJ...)"
                          className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-amber-500/30 rounded text-white text-xs font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={applyInlineEditPlaceId}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    type="url"
                    value={editGoogleReviews}
                    onChange={(e) => setEditGoogleReviews(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Facebook:</span>
                    <input
                      type="text"
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Instagram:</span>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      placeholder="@tunegocio"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Página Web:</span>
                    <input
                      type="url"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">WhatsApp:</span>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      placeholder="+51 987654321"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {editLoading ? "Guardando en MySQL..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: VER Y DESCARGAR QR DE PLACA EXISTENTE */}
      {/* ===================================================================== */}
      {qrModalDevice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl border border-slate-800 bg-[#0A0E17] max-w-sm w-full p-6 space-y-4 text-center relative">
            <button
              onClick={() => setQrModalDevice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {qrModalDevice.code}
              </span>
              <h3 className="text-base font-bold text-white mt-2">
                {qrModalDevice.business?.name || "Placa Zelo"}
              </h3>
              <p className="text-xs text-slate-400">
                Escanea con tu celular para probar la redirección.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl max-w-[200px] mx-auto shadow-inner flex items-center justify-center">
              <img
                src={`/api/qr?text=${encodeURIComponent(getFullUrl(qrModalDevice.code, "qr"))}&format=png`}
                alt="Código QR"
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/api/qr?text=${encodeURIComponent(getFullUrl(qrModalDevice.code, "qr"))}&format=png&code=${qrModalDevice.code}&download=1`}
                download
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG 1000px</span>
              </a>
              <a
                href={`/api/qr?text=${encodeURIComponent(getFullUrl(qrModalDevice.code, "qr"))}&format=svg&code=${qrModalDevice.code}&download=1`}
                download
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Vector SVG</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                onClick={() => copyToClipboard(getFullUrl(qrModalDevice.code, "qr"))}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {copiedText === getFullUrl(qrModalDevice.code, "qr")
                    ? "¡Enlace QR Copiado!"
                    : "Copiar Enlace QR"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: CONFIRMACIÓN DE ELIMINACIÓN (DELETE) */}
      {/* ===================================================================== */}
      {deletingDeviceId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl border border-slate-800 bg-[#0A0E17] max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">¿Eliminar esta placa?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Esta acción eliminará la placa y sus eventos de escaneo de la base de datos MySQL. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeletingDeviceId(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteDevice}
                disabled={deleteLoading}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
              >
                {deleteLoading ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
