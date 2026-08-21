import { prisma } from "@/lib/prisma";
import AdminDevicesClient from "./AdminDevicesClient";

export default async function AdminDevicesPage() {
  const devices = await prisma.device.findMany({
    include: {
      business: true,
      batch: true,
      _count: {
        select: { scanEvents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminDevicesClient
      devices={devices.map((d) => ({
        id: d.id,
        code: d.code,
        activationPin: d.activationPin,
        status: d.status,
        mode: d.mode,
        businessName: d.business?.name || null,
        batchName: d.batch?.name || null,
        totalScans: d._count.scanEvents,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
