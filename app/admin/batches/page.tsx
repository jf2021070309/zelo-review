import { prisma } from "@/lib/prisma";
import BatchesClient from "./BatchesClient";

export default async function AdminBatchesPage() {
  const batches = await prisma.batch.findMany({
    include: {
      _count: { select: { devices: true } },
      devices: {
        select: {
          id: true,
          code: true,
          status: true,
          activationPin: true,
        },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <BatchesClient
      batches={batches.map((b) => ({
        id: b.id,
        name: b.name,
        quantity: b.quantity,
        prefix: b.prefix,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        deviceCount: b._count.devices,
        sampleDevices: b.devices,
      }))}
    />
  );
}
