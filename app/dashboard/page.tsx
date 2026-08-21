import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardOverviewClient from "./DashboardOverviewClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = user.businesses[0] || null;

  if (!business) {
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">No tienes un negocio registrado</h1>
        <p className="text-slate-400">Por favor contacta al administrador para vincular tu negocio.</p>
      </div>
    );
  }

  // Get all devices of this business
  const devices = await prisma.device.findMany({
    where: { businessId: business.id },
    include: {
      smartProfile: true,
      _count: {
        select: { scanEvents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const deviceIds = devices.map((d) => d.id);

  // Fetch scan events for this business
  const totalScans = await prisma.scanEvent.count({
    where: { deviceId: { in: deviceIds } },
  });

  const qrScans = await prisma.scanEvent.count({
    where: { deviceId: { in: deviceIds }, source: "QR" },
  });

  const nfcScans = await prisma.scanEvent.count({
    where: { deviceId: { in: deviceIds }, source: "NFC" },
  });

  const directScans = await prisma.scanEvent.count({
    where: { deviceId: { in: deviceIds }, source: "DIRECT" },
  });

  // Recent 10 scans
  const recentScans = await prisma.scanEvent.findMany({
    where: { deviceId: { in: deviceIds } },
    include: { device: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // 14-day timeline aggregation
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const rawEvents = await prisma.scanEvent.findMany({
    where: {
      deviceId: { in: deviceIds },
      createdAt: { gte: fourteenDaysAgo },
    },
    select: {
      source: true,
      createdAt: true,
      os: true,
    },
  });

  // Aggregate by date (YYYY-MM-DD)
  const chartMap: { [key: string]: { date: string; qr: number; nfc: number; total: number } } = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const displayDate = new Intl.DateTimeFormat("es-PE", { month: "short", day: "numeric" }).format(d);
    chartMap[key] = { date: displayDate, qr: 0, nfc: 0, total: 0 };
  }

  rawEvents.forEach((ev) => {
    const key = ev.createdAt.toISOString().split("T")[0];
    if (chartMap[key]) {
      if (ev.source === "QR") chartMap[key].qr += 1;
      else if (ev.source === "NFC") chartMap[key].nfc += 1;
      chartMap[key].total += 1;
    }
  });

  const chartData = Object.values(chartMap);

  return (
    <DashboardOverviewClient
      business={business}
      devices={devices}
      stats={{
        totalScans,
        qrScans,
        nfcScans,
        directScans,
        activeDevicesCount: devices.filter((d) => d.status === "ACTIVE").length,
      }}
      chartData={chartData}
      recentScans={recentScans.map((s) => ({
        id: s.id,
        deviceCode: s.device.code,
        source: s.source,
        os: s.os || "Desconocido",
        browser: s.browser || "Desconocido",
        deviceType: s.deviceType || "mobile",
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
