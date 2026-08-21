import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DevicesClient from "./DevicesClient";

export default async function DevicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = user.businesses[0] || null;
  if (!business) redirect("/dashboard");

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

  // Calculate QR vs NFC scans per device
  const devicesWithStats = await Promise.all(
    devices.map(async (device) => {
      const qrCount = await prisma.scanEvent.count({
        where: { deviceId: device.id, source: "QR" },
      });
      const nfcCount = await prisma.scanEvent.count({
        where: { deviceId: device.id, source: "NFC" },
      });

      return {
        id: device.id,
        code: device.code,
        activationPin: device.activationPin,
        status: device.status,
        mode: device.mode,
        customDestinationUrl: device.customDestinationUrl,
        createdAt: device.createdAt.toISOString(),
        totalScans: device._count.scanEvents,
        qrScans: qrCount,
        nfcScans: nfcCount,
      };
    })
  );

  return <DevicesClient devices={devicesWithStats} businessName={business.name} />;
}
