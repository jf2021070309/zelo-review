import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardCrudClient from "./DashboardCrudClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Como hay 1 único administrador, gestiona todos los negocios y placas globales
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
  });

  const devices = await prisma.device.findMany({
    include: {
      business: true,
      smartProfile: true,
      _count: {
        select: { scanEvents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Métricas reales de escaneo QR y toques NFC por placa
  const devicesWithStats = await Promise.all(
    devices.map(async (device) => {
      const qrScans = await prisma.scanEvent.count({
        where: { deviceId: device.id, source: "QR" },
      });
      const nfcScans = await prisma.scanEvent.count({
        where: { deviceId: device.id, source: "NFC" },
      });

      return {
        id: device.id,
        code: device.code,
        activationPin: device.activationPin,
        status: device.status,
        mode: device.mode,
        customDestinationUrl: device.customDestinationUrl,
        businessId: device.businessId,
        business: device.business,
        smartProfile: device.smartProfile,
        totalScans: device._count.scanEvents,
        qrScans,
        nfcScans,
        createdAt: device.createdAt.toISOString(),
      };
    })
  );

  return (
    <DashboardCrudClient
      initialDevices={devicesWithStats}
      businesses={businesses}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
