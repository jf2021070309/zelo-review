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
  Utensils,
  Music,
  Mail,
} from "lucide-react";
import {
  normalizeChannelValue,
  ensureHttpUrl,
  normalizeInstagramUrl,
  normalizeFacebookUrl,
  normalizeTiktokUrl,
} from "@/lib/utils";

export type PlateChannelType =
  | "google"
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "website"
  | "tiktok"
  | "maps"
  | "menu"
  | "custom";

export interface PlateChannel {
  id: string;
  type: PlateChannelType;
  title: string;
  value: string;
}

export const AVAILABLE_CHANNEL_TYPES: Array<{
  type: PlateChannelType;
  label: string;
  iconName: string;
  defaultTitle: string;
  placeholder: string;
}> = [
  {
    type: "google",
    label: "⭐ Enlace Google Reviews (5 Estrellas)",
    iconName: "star",
    defaultTitle: "Google Reviews",
    placeholder: "https://search.google.com/local/writereview?placeid=...",
  },
  {
    type: "facebook",
    label: "📘 Facebook",
    iconName: "facebook",
    defaultTitle: "Facebook",
    placeholder: "https://www.facebook.com/tunegocio",
  },
  {
    type: "instagram",
    label: "📸 Instagram",
    iconName: "instagram",
    defaultTitle: "Instagram",
    placeholder: "https://www.instagram.com/tunegocio",
  },
  {
    type: "whatsapp",
    label: "💬 WhatsApp",
    iconName: "whatsapp",
    defaultTitle: "WhatsApp",
    placeholder: "+51 987654321 o enlace https://wa.me/51987654321",
  },
  {
    type: "website",
    label: "🌐 Página Web Oficial",
    iconName: "globe",
    defaultTitle: "Página Web Oficial",
    placeholder: "https://tunegocio.com",
  },
  {
    type: "tiktok",
    label: "🎵 TikTok",
    iconName: "tiktok",
    defaultTitle: "TikTok",
    placeholder: "https://www.tiktok.com/@tunegocio",
  },
  {
    type: "maps",
    label: "📍 Google Maps (Ubicación)",
    iconName: "maps",
    defaultTitle: "Google Maps",
    placeholder: "https://maps.google.com/?cid=... o link de Maps",
  },
  {
    type: "menu",
    label: "🍽️ Menú / Carta Digital",
    iconName: "menu",
    defaultTitle: "Menú / Carta Digital",
    placeholder: "https://menu.tunegocio.com o enlace a PDF",
  },
  {
    type: "custom",
    label: "➕ Nueva Categoría Personalizada...",
    iconName: "custom",
    defaultTitle: "Categoría Personalizada",
    placeholder: "https://...",
  },
];

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
  menuUrl?: string | null;
  menuEnabled?: boolean;
  googleMapsUrl?: string | null;
  googleMapsEnabled?: boolean;
  customLinks?: Array<{
    id: string;
    profileId?: string;
    title: string;
    url: string;
    icon: string;
  }>;
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
  managerEmail?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
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
  const [formManagerEmail, setFormManagerEmail] = useState("");
  const [formManagerName, setFormManagerName] = useState("");
  const [formManagerPhone, setFormManagerPhone] = useState("");
  
  // Canales Dinámicos en Crear (Por defecto SOLO Google Reviews)
  const [createChannels, setCreateChannels] = useState<PlateChannel[]>([
    {
      id: "google",
      type: "google",
      title: "Google Reviews",
      value: "",
    },
  ]);
  const [formMode, setFormMode] = useState<"DIRECT_REDIRECT" | "SMART_PROFILE">("DIRECT_REDIRECT");
  const [formStaticDestination, setFormStaticDestination] = useState<string>("google");
  const [formCustomUrl, setFormCustomUrl] = useState("");

  // Helper Place ID en Modal Crear
  const [showPlaceIdHelper, setShowPlaceIdHelper] = useState(false);
  const [inlinePlaceId, setInlinePlaceId] = useState("");
  const [placeIdMessage, setPlaceIdMessage] = useState<string | null>(null);

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
  const [editManagerEmail, setEditManagerEmail] = useState("");
  const [editManagerName, setEditManagerName] = useState("");
  const [editManagerPhone, setEditManagerPhone] = useState("");
  const [editChannels, setEditChannels] = useState<PlateChannel[]>([]);
  const [editMode, setEditMode] = useState<"DIRECT_REDIRECT" | "SMART_PROFILE">("DIRECT_REDIRECT");
  const [editCustomUrl, setEditCustomUrl] = useState("");
  const [showEditPlaceIdHelper, setShowEditPlaceIdHelper] = useState(false);
  const [inlineEditPlaceId, setInlineEditPlaceId] = useState("");
  const [editPlaceIdMessage, setEditPlaceIdMessage] = useState<string | null>(null);

  // Estado Modal Ver Detalles Completos de Placa
  const [detailsDevice, setDetailsDevice] = useState<Device | null>(null);

  // Estado Modal Ver / Descargar QR
  const [qrModalDevice, setQrModalDevice] = useState<Device | null>(null);

  // Estado Modal Eliminar (Delete)
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Gestión dinámica de canales (Create y Edit)
  const handleAddChannel = (target: "create" | "edit", type: PlateChannelType) => {
    const cat = AVAILABLE_CHANNEL_TYPES.find((c) => c.type === type);
    const newCh: PlateChannel = {
      id: type === "custom" ? `custom_${Date.now()}` : type,
      type,
      title: cat ? cat.defaultTitle : "Nueva Categoría",
      value: "",
    };

    if (target === "create") {
      setCreateChannels((prev) => {
        const next = [...prev, newCh];
        if (next.length > 1) {
          setFormMode("SMART_PROFILE");
        }
        return next;
      });
    } else {
      setEditChannels((prev) => {
        const next = [...prev, newCh];
        if (next.length > 1) {
          setEditMode("SMART_PROFILE");
        }
        return next;
      });
    }
  };

  const handleRemoveChannel = (target: "create" | "edit", id: string) => {
    if (target === "create") {
      setCreateChannels((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (next.length === 1) {
          setFormMode("DIRECT_REDIRECT");
        }
        return next;
      });
    } else {
      setEditChannels((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (next.length === 1) {
          setEditMode("DIRECT_REDIRECT");
        }
        return next;
      });
    }
  };

  const handleChannelValueChange = (target: "create" | "edit", id: string, val: string) => {
    if (target === "create") {
      setCreateChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, value: val } : c))
      );
    } else {
      setEditChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, value: val } : c))
      );
    }
  };

  const handleChannelTitleChange = (target: "create" | "edit", id: string, title: string) => {
    if (target === "create") {
      setCreateChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } else {
      setEditChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    }
  };

  const handleChannelBlur = (target: "create" | "edit", id: string, type: PlateChannelType, val: string) => {
    if (!val || !val.trim()) return;
    const normalized = normalizeChannelValue(type, val);
    if (normalized !== val) {
      handleChannelValueChange(target, id, normalized);
    }
  };

  // Convertidor de Google Place ID
  const applyInlinePlaceId = (target: "create" | "edit", customId?: string) => {
    const raw = (customId ?? (target === "create" ? inlinePlaceId : inlineEditPlaceId)).trim();
    if (!raw) return;

    let cleanId = raw;
    const match = raw.match(/[?&]place(?:_)?id=([A-Za-z0-9_-]+)/i);
    if (match && match[1]) {
      cleanId = match[1];
    } else if (raw.includes("google.com/maps/place/")) {
      const afterPlace = raw.split("/place/")[1]?.split("/")[0] || raw;
      cleanId = afterPlace.replace(/[^A-Za-z0-9_-]/g, "");
    }

    const generatedUrl = `https://search.google.com/local/writereview?placeid=${cleanId}`;

    if (target === "create") {
      setCreateChannels((prev) => {
        const idx = prev.findIndex((c) => c.type === "google");
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], value: generatedUrl };
          return next;
        }
        return [{ id: "google", type: "google", title: "Google Reviews", value: generatedUrl }, ...prev];
      });
      setPlaceIdMessage("¡Enlace oficial de 5 estrellas generado con éxito!");
      setTimeout(() => setPlaceIdMessage(null), 3500);
      setInlinePlaceId("");
    } else {
      setEditChannels((prev) => {
        const idx = prev.findIndex((c) => c.type === "google");
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], value: generatedUrl };
          return next;
        }
        return [{ id: "google", type: "google", title: "Google Reviews", value: generatedUrl }, ...prev];
      });
      setEditPlaceIdMessage("¡Enlace oficial de 5 estrellas generado con éxito!");
      setTimeout(() => setEditPlaceIdMessage(null), 3500);
      setInlineEditPlaceId("");
    }
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
      setCreateChannels([
        {
          id: "google",
          type: "google",
          title: "Google Reviews",
          value: "",
        },
      ]);
      setFormMode("DIRECT_REDIRECT");
    } else {
      const b = businesses.find((item) => item.id === val);
      if (b) {
        setFormBusinessName(b.name);
        const chs: PlateChannel[] = [];
        if (b.googleReviewUrl) chs.push({ id: "google", type: "google", title: "Google Reviews", value: ensureHttpUrl(b.googleReviewUrl) });
        if (b.facebook) chs.push({ id: "facebook", type: "facebook", title: "Facebook", value: normalizeFacebookUrl(b.facebook) });
        if (b.instagram) chs.push({ id: "instagram", type: "instagram", title: "Instagram", value: normalizeInstagramUrl(b.instagram) });
        if (b.whatsapp) chs.push({ id: "whatsapp", type: "whatsapp", title: "WhatsApp", value: b.whatsapp });
        if (b.website) chs.push({ id: "website", type: "website", title: "Página Web Oficial", value: ensureHttpUrl(b.website) });

        if (chs.length === 0) {
          chs.push({ id: "google", type: "google", title: "Google Reviews", value: "" });
        }
        setCreateChannels(chs);
        setFormMode(chs.length > 1 ? "SMART_PROFILE" : "DIRECT_REDIRECT");
      }
    }
  };

  // Crear / Generar nueva placa
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const normalizedChannels = createChannels.map((c) => ({
        ...c,
        value: normalizeChannelValue(c.type, c.value),
      }));

      const payload = {
        businessName: formBusinessName,
        existingBusinessId: businessSelection === "new" ? null : businessSelection,
        managerEmail: formManagerEmail.trim() || null,
        managerName: formManagerName.trim() || null,
        managerPhone: formManagerPhone.trim() || null,
        mode: formMode,
        staticDestinationType: formStaticDestination,
        customDestinationUrl: formCustomUrl ? ensureHttpUrl(formCustomUrl) : null,
        channels: normalizedChannels,
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
        managerEmail: data.device.managerEmail || formManagerEmail.trim() || null,
        managerName: data.device.managerName || formManagerName.trim() || null,
        managerPhone: data.device.managerPhone || formManagerPhone.trim() || null,
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
      setFormManagerEmail("");
      setFormManagerName("");
      setFormManagerPhone("");
      setCreateChannels([
        {
          id: "google",
          type: "google",
          title: "Google Reviews",
          value: "",
        },
      ]);
      setFormMode("DIRECT_REDIRECT");
      setFormCustomUrl("");
      setShowPlaceIdHelper(false);
      setInlinePlaceId("");
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
    setEditManagerEmail(dev.managerEmail || "");
    setEditManagerName(dev.managerName || "");
    setEditManagerPhone(dev.managerPhone || "");
    setEditMode(dev.mode);
    setEditCustomUrl(dev.customDestinationUrl || "");
    setShowEditPlaceIdHelper(false);
    setInlineEditPlaceId("");
    setEditPlaceIdMessage(null);

    // Armar canales desde los datos actuales del dispositivo
    const chs: PlateChannel[] = [];
    const gUrl = dev.smartProfile?.googleReviewUrl || dev.business?.googleReviewUrl;
    if (gUrl) chs.push({ id: "google", type: "google", title: "Google Reviews", value: ensureHttpUrl(gUrl) });

    const fbUrl = dev.smartProfile?.facebookUrl || dev.business?.facebook;
    if (fbUrl) chs.push({ id: "facebook", type: "facebook", title: "Facebook", value: normalizeFacebookUrl(fbUrl) });

    const igUrl = dev.smartProfile?.instagramHandle || dev.business?.instagram;
    if (igUrl) chs.push({ id: "instagram", type: "instagram", title: "Instagram", value: normalizeInstagramUrl(igUrl) });

    const waNum = dev.smartProfile?.whatsappNumber || dev.business?.whatsapp;
    if (waNum) chs.push({ id: "whatsapp", type: "whatsapp", title: "WhatsApp", value: waNum });

    const webUrl = dev.smartProfile?.websiteUrl || dev.business?.website;
    if (webUrl) chs.push({ id: "website", type: "website", title: "Página Web Oficial", value: ensureHttpUrl(webUrl) });

    const mUrl = dev.smartProfile?.menuUrl;
    if (mUrl) chs.push({ id: "menu", type: "menu", title: "Menú / Carta Digital", value: ensureHttpUrl(mUrl) });

    const mapsUrl = dev.smartProfile?.googleMapsUrl;
    if (mapsUrl) chs.push({ id: "maps", type: "maps", title: "Google Maps", value: ensureHttpUrl(mapsUrl) });

    if (dev.smartProfile?.customLinks && dev.smartProfile.customLinks.length > 0) {
      dev.smartProfile.customLinks.forEach((cl, i) => {
        const isTiktok = cl.icon === "music";
        chs.push({
          id: `custom_${cl.id || i}`,
          type: isTiktok ? "tiktok" : "custom",
          title: cl.title,
          value: isTiktok ? normalizeTiktokUrl(cl.url) : ensureHttpUrl(cl.url),
        });
      });
    }

    if (chs.length === 0) {
      chs.push({ id: "google", type: "google", title: "Google Reviews", value: "" });
    }

    setEditChannels(chs);
  };

  // Guardar Edición (Update)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const normalizedChannels = editChannels.map((c) => ({
        ...c,
        value: normalizeChannelValue(c.type, c.value),
      }));

      const payload = {
        businessName: editBusinessName,
        managerEmail: editManagerEmail.trim() || null,
        managerName: editManagerName.trim() || null,
        managerPhone: editManagerPhone.trim() || null,
        mode: editMode,
        customDestinationUrl: editCustomUrl ? ensureHttpUrl(editCustomUrl) : null,
        channels: normalizedChannels,
      };

      const res = await fetch(`/api/devices/${editingDevice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar la placa.");

      // Extraer campos clave normalizados
      const gReview = normalizedChannels.find((c) => c.type === "google")?.value || "";
      const fb = normalizedChannels.find((c) => c.type === "facebook")?.value || "";
      const ig = normalizedChannels.find((c) => c.type === "instagram")?.value || "";
      const wa = normalizedChannels.find((c) => c.type === "whatsapp")?.value || "";
      const web = normalizedChannels.find((c) => c.type === "website")?.value || "";
      const menu = normalizedChannels.find((c) => c.type === "menu")?.value || "";
      const maps = normalizedChannels.find((c) => c.type === "maps")?.value || "";
      const customLinks = normalizedChannels
        .filter((c) => c.type === "custom" || c.type === "tiktok")
        .map((cl, i) => ({
          id: cl.id,
          title: cl.title,
          url: cl.value,
          icon: cl.type === "tiktok" ? "music" : "globe",
        }));

      const cleanMgrEmail = editManagerEmail.trim() || null;
      const cleanMgrName = editManagerName.trim() || null;
      const cleanMgrPhone = editManagerPhone.trim() || null;

      // Actualizar estado local
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === editingDevice.id) {
            const updated = {
              ...d,
              mode: editMode,
              customDestinationUrl: editCustomUrl || null,
              managerEmail: cleanMgrEmail,
              managerName: cleanMgrName,
              managerPhone: cleanMgrPhone,
              business: d.business
                ? {
                    ...d.business,
                    name: editBusinessName,
                    website: web,
                    facebook: fb,
                    instagram: ig,
                    whatsapp: wa,
                    googleReviewUrl: gReview,
                  }
                : null,
              smartProfile: d.smartProfile
                ? {
                    ...d.smartProfile,
                    title: editBusinessName,
                    websiteUrl: web,
                    facebookUrl: fb,
                    instagramHandle: ig,
                    whatsappNumber: wa,
                    googleReviewUrl: gReview,
                    menuUrl: menu,
                    googleMapsUrl: maps,
                    customLinks,
                  }
                : null,
            };
            return updated;
          }
          return d;
        })
      );

      // Sincronizar modal de detalles si está abierto
      setDetailsDevice((prev) => {
        if (!prev || prev.id !== editingDevice.id) return prev;
        return {
          ...prev,
          mode: editMode,
          customDestinationUrl: editCustomUrl || null,
          managerEmail: cleanMgrEmail,
          managerName: cleanMgrName,
          managerPhone: cleanMgrPhone,
          business: prev.business
            ? {
                ...prev.business,
                name: editBusinessName,
                website: web,
                facebook: fb,
                instagram: ig,
                whatsapp: wa,
                googleReviewUrl: gReview,
              }
            : null,
          smartProfile: prev.smartProfile
            ? {
                ...prev.smartProfile,
                title: editBusinessName,
                websiteUrl: web,
                facebookUrl: fb,
                instagramHandle: ig,
                whatsappNumber: wa,
                googleReviewUrl: gReview,
                menuUrl: menu,
                googleMapsUrl: maps,
                customLinks,
              }
            : null,
        };
      });

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
        setDetailsDevice((prev) =>
          prev && prev.id === dev.id ? { ...prev, status: nextStatus } : prev
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
                  <th className="py-4 px-6">Código / PIN</th>
                  <th className="py-4 px-6">Negocio</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredDevices.map((dev) => {
                  return (
                    <tr
                      key={dev.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Código y PIN */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-slate-950 px-2.5 py-1 rounded-md border border-slate-700 text-xs shadow-sm">
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
                        <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-2 font-mono">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Lock className="w-3 h-3" />
                            <span>PIN: {dev.activationPin}</span>
                          </span>
                          <span>•</span>
                          <button
                            onClick={() => handleToggleStatus(dev)}
                            title="Clic para cambiar estado"
                            className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                              dev.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                          >
                            {dev.status === "ACTIVE" ? "Activo" : "Suspendido"}
                          </button>
                        </div>
                      </td>

                      {/* Negocio */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm truncate max-w-sm">
                          {dev.business?.name || "Sin Negocio Asignado"}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                          <span className="font-mono text-slate-500">{dev.business?.slug || "—"}</span>
                          {dev.managerEmail ? (
                            <>
                              <span className="text-slate-600">•</span>
                              <span
                                className="text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 text-[11px]"
                                title={`Gerente: ${dev.managerEmail}`}
                              >
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="font-mono truncate max-w-[200px]">{dev.managerEmail}</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500 text-[10px] italic">Sin correo de gerente</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ver Detalles (Modal con métricas, gerente y canales) */}
                          <button
                            onClick={() => setDetailsDevice(dev)}
                            title="Ver detalles completos, métricas y gerente de la placa"
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalles</span>
                          </button>

                          {/* Ver Enlaces QR y NFC / Descargar QR */}
                          <button
                            onClick={() => setQrModalDevice(dev)}
                            title="Ver Enlaces (QR y NFC) / Descargar QR"
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:text-white border border-emerald-500/30 transition flex items-center gap-1 text-xs font-semibold"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] font-bold">QR / NFC</span>
                          </button>

                          {/* Editar (Update) */}
                          <button
                            onClick={() => openEditModal(dev)}
                            title="Editar placa, gerente y canales"
                            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar (Delete) */}
                          <button
                            onClick={() => setDeletingDeviceId(dev.id)}
                            title="Eliminar placa"
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/30 transition"
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
      {/* MODAL 1: GENERAR NUEVA PLACA (CON CANALES DINÁMICOS Y PLACE ID FINDER) */}
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
                Selecciona solo los enlaces que tu cliente necesita. Por defecto incluye Google Reviews con apertura directa de 5 estrellas.
              </p>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* 1. Selección de Negocio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  1. Selección de Negocio
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

              {/* Gerente Responsable y Alertas de Reseñas */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Correo del Negocio para Alertas (SMTP Zelo)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    SMTP Oficial Conectado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Las opiniones negativas de clientes (1 a 3 estrellas) serán interceptadas en privado y enviadas de inmediato y directamente a este correo desde el servidor SMTP de ZELO.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Correo del Negocio / Encargado <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formManagerEmail}
                    onChange={(e) => setFormManagerEmail(e.target.value)}
                    placeholder="contacto@minegocio.com o gerente@minegocio.com"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* 2. Canales y Enlaces a Generar */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      2. Canales y Enlaces a Generar
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Configura solo los canales que el cliente usará para no generar enlaces innecesarios.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {createChannels.length} {createChannels.length === 1 ? "canal" : "canales"}
                  </span>
                </div>

                {/* Lista de Canales Activos */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {createChannels.map((ch) => {
                    if (ch.type === "google") {
                      return (
                        <div key={ch.id} className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <Star className="w-3 h-3" />
                              </div>
                              <span className="text-xs font-bold text-white">⭐ Enlace Google Reviews (5 Estrellas)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowPlaceIdHelper(!showPlaceIdHelper)}
                                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 transition"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>{showPlaceIdHelper ? "Cerrar Place ID" : "⚡ Usar Place ID Finder"}</span>
                              </button>
                              {createChannels.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChannel("create", ch.id)}
                                  title="Quitar canal"
                                  className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Herramienta Integrada Place ID */}
                          {showPlaceIdHelper && (
                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-amber-300 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>Convertir Google Place ID en enlace 5 estrellas directo:</span>
                                </span>
                                <a
                                  href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  <span>Buscador Oficial Google</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={inlinePlaceId}
                                  onChange={(e) => setInlinePlaceId(e.target.value)}
                                  placeholder="Pega Place ID (ej. ChIJ...) o link copiado de Maps"
                                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-amber-500/30 rounded text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => applyInlinePlaceId("create")}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition"
                                >
                                  Convertir
                                </button>
                              </div>
                              {placeIdMessage && (
                                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>{placeIdMessage}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                                <span>Ejemplos rápidos:</span>
                                <button
                                  type="button"
                                  onClick={() => applyInlinePlaceId("create", "ChIJLU7jZClu5kcR4PcOOO6p3I0")}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 transition"
                                >
                                  Torre Eiffel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyInlinePlaceId("create", "ChIJaXQRs6lZwokRY6EFpJnhNNE")}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 transition"
                                >
                                  Empire State
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyInlinePlaceId("create", "ChIJ_yH37L7MBZERk686zPq_6YI")}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 transition"
                                >
                                  Central Lima
                                </button>
                              </div>
                            </div>
                          )}

                          <input
                            type="url"
                            value={ch.value}
                            onChange={(e) => handleChannelValueChange("create", ch.id, e.target.value)}
                            onBlur={() => handleChannelBlur("create", ch.id, ch.type, ch.value)}
                            placeholder="https://search.google.com/local/writereview?placeid=..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      );
                    }

                    if (ch.type === "custom") {
                      return (
                        <div key={ch.id} className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                              <input
                                type="text"
                                value={ch.title}
                                onChange={(e) => handleChannelTitleChange("create", ch.id, e.target.value)}
                                placeholder="Nombre de la categoría (ej: TripAdvisor, Delivery, PedidosYa)"
                                className="px-2 py-1 bg-slate-950 border border-indigo-500/30 rounded text-xs text-white font-semibold flex-1 focus:outline-none focus:border-indigo-400"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChannel("create", ch.id)}
                              title="Quitar canal"
                              className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="url"
                            value={ch.value}
                            onChange={(e) => handleChannelValueChange("create", ch.id, e.target.value)}
                            onBlur={() => handleChannelBlur("create", ch.id, ch.type, ch.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      );
                    }

                    // Otros canales predeterminados (Facebook, Instagram, WhatsApp, Website, TikTok, Maps, Menu)
                    return (
                      <div key={ch.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            {ch.type === "facebook" && <span className="font-bold text-xs text-blue-400">fb</span>}
                            {ch.type === "instagram" && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                            {ch.type === "whatsapp" && <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            {ch.type === "website" && <Globe className="w-3.5 h-3.5 text-cyan-400" />}
                            {ch.type === "tiktok" && <Music className="w-3.5 h-3.5 text-rose-400" />}
                            {ch.type === "maps" && <MapPin className="w-3.5 h-3.5 text-red-400" />}
                            {ch.type === "menu" && <Utensils className="w-3.5 h-3.5 text-amber-400" />}
                            <span className="font-semibold text-white">{ch.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChannel("create", ch.id)}
                            title="Quitar canal"
                            className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={ch.value}
                          onChange={(e) => handleChannelValueChange("create", ch.id, e.target.value)}
                          onBlur={() => handleChannelBlur("create", ch.id, ch.type, ch.value)}
                          placeholder={
                            ch.type === "facebook"
                              ? "https://www.facebook.com/tunegocio"
                              : ch.type === "instagram"
                              ? "https://www.instagram.com/tunegocio"
                              : ch.type === "whatsapp"
                              ? "+51 987654321 o enlace https://wa.me/51987654321"
                              : ch.type === "website"
                              ? "https://tunegocio.com"
                              : ch.type === "tiktok"
                              ? "https://www.tiktok.com/@tunegocio"
                              : ch.type === "maps"
                              ? "https://maps.google.com/?cid=..."
                              : "https://menu.tunegocio.com"
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Combobox para agregar nuevos canales */}
                <div className="pt-1">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddChannel("create", e.target.value as PlateChannelType);
                        e.target.value = "";
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-indigo-300 text-xs font-semibold focus:outline-none cursor-pointer transition"
                  >
                    <option value="" disabled>➕ Agregar Canal / Enlace (Facebook, IG, WA, Web, TikTok, Menú, Categoría...)</option>
                    {AVAILABLE_CHANNEL_TYPES.map((cat) => {
                      const already = cat.type !== "custom" && createChannels.some((c) => c.type === cat.type);
                      return (
                        <option key={cat.type} value={cat.type} disabled={already}>
                          {cat.label} {already ? "(Ya agregado)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* 3. Tipo de Redirección (Inteligente) */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    3. Tipo de Redirección
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {createChannels.length <= 1
                      ? "⭐ Recomendado: Modo Estático (Abre directo el enlace)"
                      : "✨ Recomendado: Modo Dinámico (Bio-Hub con menú)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormMode("DIRECT_REDIRECT")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formMode === "DIRECT_REDIRECT"
                        ? "bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <span>Modo Estático (Directo)</span>
                        {createChannels.length <= 1 && (
                          <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded font-mono">
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        Abre directamente 1 a 1 sin pasar por menú intermedio.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMode("SMART_PROFILE")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formMode === "SMART_PROFILE"
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                        <span>Modo Dinámico (Bio-Hub)</span>
                        {createChannels.length > 1 && (
                          <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1 py-0.2 rounded font-mono">
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        Página interactiva con botones hacia todos tus enlaces activos.
                      </div>
                    </div>
                  </button>
                </div>

                {/* Sub-selector si es Modo Estático y hay varios canales */}
                {formMode === "DIRECT_REDIRECT" && createChannels.length > 1 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 mt-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      ¿A cuál de los enlaces configurados redirigirá directamente?
                    </label>
                    <select
                      value={formStaticDestination}
                      onChange={(e) => setFormStaticDestination(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-amber-500/30 rounded-lg text-white text-xs focus:outline-none"
                    >
                      {createChannels.map((c) => (
                        <option key={c.id} value={c.type}>
                          {c.title} ({c.type})
                        </option>
                      ))}
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
      {/* MODAL 3: EDITAR PLACA (CANALES DINÁMICOS Y PLACE ID FINDER) */}
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
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {editingDevice.code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const dev = editingDevice;
                    setEditingDevice(null);
                    setQrModalDevice(dev);
                  }}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 transition"
                  title="Ver enlaces QR y NFC de esta placa"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Ver Enlaces QR / NFC</span>
                </button>
              </div>
              <h2 className="text-xl font-black text-white mt-2">Editar Configuración de Placa</h2>
              <p className="text-xs text-slate-400">
                Agrega, edita o elimina canales. Los cambios se actualizan al instante en tiempo real.
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

              {/* Gerente Responsable y Alertas de Reseñas */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Correo del Negocio para Alertas (SMTP Zelo)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    SMTP Oficial Conectado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Las opiniones negativas de clientes (1 a 3 estrellas) serán interceptadas en privado y enviadas de inmediato y directamente a este correo desde el servidor SMTP de ZELO.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Correo del Negocio / Encargado <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={editManagerEmail}
                    onChange={(e) => setEditManagerEmail(e.target.value)}
                    placeholder="contacto@minegocio.com o gerente@minegocio.com"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Canales y Enlaces en Edición */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Canales y Enlaces Activos
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Ingresa el enlace completo con https:// (ej: https://www.instagram.com/tunegocio) para redireccionar correctamente en todos los celulares.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {editChannels.length} {editChannels.length === 1 ? "canal" : "canales"}
                  </span>
                </div>

                {/* Lista de Canales */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {editChannels.map((ch) => {
                    if (ch.type === "google") {
                      return (
                        <div key={ch.id} className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <Star className="w-3 h-3" />
                              </div>
                              <span className="text-xs font-bold text-white">⭐ Enlace Google Reviews (5 Estrellas)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowEditPlaceIdHelper(!showEditPlaceIdHelper)}
                                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 transition"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>{showEditPlaceIdHelper ? "Cerrar Place ID" : "⚡ Usar Place ID Finder"}</span>
                              </button>
                              {editChannels.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChannel("edit", ch.id)}
                                  title="Quitar canal"
                                  className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {showEditPlaceIdHelper && (
                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-amber-300 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>Convertir Google Place ID en enlace 5 estrellas directo:</span>
                                </span>
                                <a
                                  href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  <span>Buscador Oficial Google</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={inlineEditPlaceId}
                                  onChange={(e) => setInlineEditPlaceId(e.target.value)}
                                  placeholder="Pega Place ID (ej. ChIJ...) o link copiado de Maps"
                                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-amber-500/30 rounded text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => applyInlinePlaceId("edit")}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition"
                                >
                                  Convertir
                                </button>
                              </div>
                              {editPlaceIdMessage && (
                                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>{editPlaceIdMessage}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <input
                            type="url"
                            value={ch.value}
                            onChange={(e) => handleChannelValueChange("edit", ch.id, e.target.value)}
                            onBlur={() => handleChannelBlur("edit", ch.id, ch.type, ch.value)}
                            placeholder="https://search.google.com/local/writereview?placeid=..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      );
                    }

                    if (ch.type === "custom") {
                      return (
                        <div key={ch.id} className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                              <input
                                type="text"
                                value={ch.title}
                                onChange={(e) => handleChannelTitleChange("edit", ch.id, e.target.value)}
                                placeholder="Nombre de categoría (ej: TripAdvisor, Delivery, Menú)"
                                className="px-2 py-1 bg-slate-950 border border-indigo-500/30 rounded text-xs text-white font-semibold flex-1 focus:outline-none focus:border-indigo-400"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChannel("edit", ch.id)}
                              title="Quitar canal"
                              className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="url"
                            value={ch.value}
                            onChange={(e) => handleChannelValueChange("edit", ch.id, e.target.value)}
                            onBlur={() => handleChannelBlur("edit", ch.id, ch.type, ch.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={ch.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            {ch.type === "facebook" && <span className="font-bold text-xs text-blue-400">fb</span>}
                            {ch.type === "instagram" && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                            {ch.type === "whatsapp" && <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            {ch.type === "website" && <Globe className="w-3.5 h-3.5 text-cyan-400" />}
                            {ch.type === "tiktok" && <Music className="w-3.5 h-3.5 text-rose-400" />}
                            {ch.type === "maps" && <MapPin className="w-3.5 h-3.5 text-red-400" />}
                            {ch.type === "menu" && <Utensils className="w-3.5 h-3.5 text-amber-400" />}
                            <span className="font-semibold text-white">{ch.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChannel("edit", ch.id)}
                            title="Quitar canal"
                            className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={ch.value}
                          onChange={(e) => handleChannelValueChange("edit", ch.id, e.target.value)}
                          onBlur={() => handleChannelBlur("edit", ch.id, ch.type, ch.value)}
                          placeholder={
                            ch.type === "facebook"
                              ? "https://www.facebook.com/tunegocio"
                              : ch.type === "instagram"
                              ? "https://www.instagram.com/tunegocio"
                              : ch.type === "whatsapp"
                              ? "+51 987654321 o enlace https://wa.me/51987654321"
                              : ch.type === "website"
                              ? "https://tunegocio.com"
                              : ch.type === "tiktok"
                              ? "https://www.tiktok.com/@tunegocio"
                              : ch.type === "maps"
                              ? "https://maps.google.com/?cid=..."
                              : "https://menu.tunegocio.com"
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Combobox agregar canales en edición */}
                <div className="pt-1">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddChannel("edit", e.target.value as PlateChannelType);
                        e.target.value = "";
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-indigo-300 text-xs font-semibold focus:outline-none cursor-pointer transition"
                  >
                    <option value="" disabled>➕ Agregar Canal / Enlace (Facebook, IG, WA, Web, TikTok, Menú, Categoría...)</option>
                    {AVAILABLE_CHANNEL_TYPES.map((cat) => {
                      const already = cat.type !== "custom" && editChannels.some((c) => c.type === cat.type);
                      return (
                        <option key={cat.type} value={cat.type} disabled={already}>
                          {cat.label} {already ? "(Ya agregado)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Modo de Redirección */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Modo de Redirección
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                    <span>Estático (Directo 1 a 1)</span>
                  </button>

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
                </div>
              </div>

              {editMode === "DIRECT_REDIRECT" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    URL de Redirección Directa Personalizada (Opcional)
                  </label>
                  <input
                    type="url"
                    value={editCustomUrl}
                    onChange={(e) => setEditCustomUrl(e.target.value)}
                    placeholder="Si se deja vacío, redirigirá al primer enlace activo de arriba"
                    className="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-lg text-white text-xs focus:outline-none"
                  />
                </div>
              )}

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
      {/* MODAL 4: VER Y DESCARGAR QR Y ENLACES NFC DE PLACA EXISTENTE */}
      {/* ===================================================================== */}
      {qrModalDevice && (() => {
        const qrUrl = getFullUrl(qrModalDevice.code, "qr");
        const nfcUrl = getFullUrl(qrModalDevice.code, "nfc");

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-card rounded-2xl border border-slate-800 bg-[#0A0E17] max-w-md w-full p-6 space-y-4 relative my-8">
              <button
                onClick={() => setQrModalDevice(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700">
                    {qrModalDevice.code}
                  </span>
                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> PIN: {qrModalDevice.activationPin}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {qrModalDevice.business?.name || "Placa Zelo"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enlaces físicos para impresión de QR y grabación de chips NFC.
                </p>
              </div>

              {/* Previsualización de QR */}
              <div className="p-3 bg-white rounded-2xl max-w-[170px] mx-auto shadow-inner flex items-center justify-center">
                <img
                  src={`/api/qr?text=${encodeURIComponent(qrUrl)}&format=png`}
                  alt="Código QR"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Botones de descarga de QR */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/api/qr?text=${encodeURIComponent(qrUrl)}&format=png&code=${qrModalDevice.code}&download=1`}
                  download
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PNG</span>
                </a>
                <a
                  href={`/api/qr?text=${encodeURIComponent(qrUrl)}&format=svg&code=${qrModalDevice.code}&download=1`}
                  download
                  className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Vector SVG</span>
                </a>
              </div>

              {/* Sección de Enlaces Físicos (QR y NFC) */}
              <div className="space-y-2.5 text-left text-xs pt-1 border-t border-slate-800/80">
                {/* Enlace QR */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>URL PARA CÓDIGO QR:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">?src=qr</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/50 border border-slate-800/80 font-mono text-[11px] text-slate-300 break-all select-all">
                    {qrUrl}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">
                      Enlace codificado en el QR impreso.
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Probar enlace QR en nueva pestaña"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Probar</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(qrUrl)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                          copiedText === qrUrl
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                        }`}
                      >
                        {copiedText === qrUrl ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enlace NFC */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>URL PARA CHIP NFC:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">?src=nfc</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/50 border border-slate-800/80 font-mono text-[11px] text-slate-300 break-all select-all">
                    {nfcUrl}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">
                      Graba este enlace en el chip NFC (NTAG213/215).
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={nfcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Probar enlace NFC en nueva pestaña"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Probar</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(nfcUrl)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                          copiedText === nfcUrl
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                        }`}
                      >
                        {copiedText === nfcUrl ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setQrModalDevice(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* MODAL: DETALLES COMPLETOS DE PLACA (MÉTRICAS, GERENTE Y CANALES) */}
      {/* ===================================================================== */}
      {detailsDevice && (() => {
        const qrUrl = getFullUrl(detailsDevice.code, "qr");
        const nfcUrl = getFullUrl(detailsDevice.code, "nfc");
        const total = detailsDevice.totalScans || 0;
        const qrPct = total > 0 ? Math.round((detailsDevice.qrScans / total) * 100) : 0;
        const nfcPct = total > 0 ? Math.round((detailsDevice.nfcScans / total) * 100) : 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-card rounded-2xl border border-slate-800 bg-[#0A0E17] max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
              <button
                onClick={() => setDetailsDevice(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header con Código, PIN y Estado */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                    <span>{detailsDevice.code}</span>
                    <button
                      onClick={() => copyToClipboard(detailsDevice.code)}
                      title="Copiar código"
                      className="text-slate-500 hover:text-slate-300 transition"
                    >
                      {copiedText === detailsDevice.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>
                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    <span>PIN: {detailsDevice.activationPin}</span>
                    <button
                      onClick={() => copyToClipboard(detailsDevice.activationPin)}
                      title="Copiar PIN"
                      className="text-amber-500 hover:text-amber-300 transition"
                    >
                      {copiedText === detailsDevice.activationPin ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                  <button
                    onClick={() => handleToggleStatus(detailsDevice)}
                    title="Alternar estado de la placa"
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition ${
                      detailsDevice.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                    }`}
                  >
                    {detailsDevice.status === "ACTIVE" ? "🟢 Placa Activa" : "🔴 Placa Suspendida"}
                  </button>
                </div>
                <h2 className="text-xl font-black text-white">
                  {detailsDevice.business?.name || "Sin Negocio Asignado"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Identificador slug: <code className="text-slate-300 font-mono">{detailsDevice.business?.slug || "—"}</code> • Registrada: {new Date(detailsDevice.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Sección 1: Gerente Responsable & Alertas de Reseñas */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>Gerente Responsable & Filtro de Reseñas</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Protección de Reputación
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                      Correo para Alertas
                    </span>
                    {detailsDevice.managerEmail ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-white text-xs truncate">
                          {detailsDevice.managerEmail}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(detailsDevice.managerEmail || "")}
                            title="Copiar correo"
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                          >
                            {copiedText === detailsDevice.managerEmail ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`mailto:${detailsDevice.managerEmail}`}
                            title="Enviar correo"
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic text-[11px]">
                        No configurado aún. Haz clic en "Editar Placa" para asignarlo.
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                      Canal de Alertas de Reseña
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-xs font-semibold text-white">SMTP Oficial ZELO</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold font-mono">
                        Zoho Mail
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Envío directo e inmediato al correo del negocio cuando una calificación sea ≤ 3 estrellas.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>¿Cómo funciona?</strong> Cuando un cliente califica con 1 a 3 estrellas, la reseña no llega a Google. Se intercepta inmediatamente y se envía una notificación al gerente asignado para resolver el reclamo en privado.
                  </span>
                </div>
              </div>

              {/* Sección 2: Métricas Reales (Total, QR, NFC) */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Métricas de Visitas Físicas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Probar redirección de la placa"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Probar Redirección</span>
                    </a>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Total Visitas
                    </span>
                    <span className="text-2xl font-black text-white mt-0.5 block">
                      {total}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
                      <QrCode className="w-3 h-3" /> QR ({qrPct}%)
                    </span>
                    <span className="text-2xl font-black text-emerald-300 mt-0.5 block">
                      {detailsDevice.qrScans}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
                      <Smartphone className="w-3 h-3" /> NFC ({nfcPct}%)
                    </span>
                    <span className="text-2xl font-black text-cyan-300 mt-0.5 block">
                      {detailsDevice.nfcScans}
                    </span>
                  </div>
                </div>

                {/* Proportion bar */}
                {total > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        style={{ width: `${qrPct}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`QR: ${qrPct}%`}
                      />
                      <div
                        style={{ width: `${nfcPct}%` }}
                        className="bg-cyan-500 h-full transition-all"
                        title={`NFC: ${nfcPct}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>📷 QR: {detailsDevice.qrScans} escaneos ({qrPct}%)</span>
                      <span>📱 NFC: {detailsDevice.nfcScans} toques ({nfcPct}%)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 3: Modo de Redirección & Canales */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Modo de Redirección & Canales</span>
                  </div>
                  {detailsDevice.mode === "SMART_PROFILE" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Dinámico (Bio-Hub)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Estático (Directo)</span>
                    </span>
                  )}
                </div>

                {/* Destino URL */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Destino Principal al Escanear:
                  </span>
                  <a
                    href={detailsDevice.customDestinationUrl || detailsDevice.business?.googleReviewUrl || "https://search.google.com/local/writereview"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline font-mono text-[11px] break-all flex items-center gap-1"
                  >
                    <span>{detailsDevice.customDestinationUrl || detailsDevice.business?.googleReviewUrl || "https://search.google.com/local/writereview"}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>

                {/* Canales Activos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Canales Configurados en esta Placa:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {detailsDevice.smartProfile?.googleReviewUrl || detailsDevice.business?.googleReviewUrl ? (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>Google Reviews</span>
                      </span>
                    ) : null}
                    {detailsDevice.smartProfile?.facebookUrl || detailsDevice.business?.facebook ? (
                      <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-medium flex items-center gap-1.5">
                        <span className="font-bold text-[11px]">fb</span>
                        <span>Facebook</span>
                      </span>
                    ) : null}
                    {detailsDevice.smartProfile?.instagramHandle || detailsDevice.business?.instagram ? (
                      <span className="px-2 py-1 rounded-md bg-pink-500/10 text-pink-300 border border-pink-500/20 text-xs font-medium flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        <span>Instagram</span>
                      </span>
                    ) : null}
                    {detailsDevice.smartProfile?.whatsappNumber || detailsDevice.business?.whatsapp ? (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </span>
                    ) : null}
                    {detailsDevice.smartProfile?.websiteUrl || detailsDevice.business?.website ? (
                      <span className="px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-medium flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Sitio Web</span>
                      </span>
                    ) : null}
                    {detailsDevice.smartProfile?.menuUrl ? (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        <span>Menú Digital</span>
                      </span>
                    ) : null}
                    {detailsDevice.smartProfile?.googleMapsUrl ? (
                      <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>Google Maps</span>
                      </span>
                    ) : null}
                    {detailsDevice.smartProfile?.customLinks?.map((cl) => (
                      <span
                        key={cl.id}
                        className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center gap-1.5"
                      >
                        {cl.icon === "music" ? <Music className="w-3.5 h-3.5 text-rose-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                        <span>{cl.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones de acción del Modal de Detalles */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDetailsDevice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cerrar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = detailsDevice;
                      setDetailsDevice(null);
                      setQrModalDevice(d);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ver / Descargar QR y NFC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = detailsDevice;
                      setDetailsDevice(null);
                      openEditModal(d);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Placa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
