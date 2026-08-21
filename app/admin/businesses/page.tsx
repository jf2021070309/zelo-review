import { prisma } from "@/lib/prisma";
import AdminBusinessesClient from "./AdminBusinessesClient";

export default async function AdminBusinessesPage() {
  const businesses = await prisma.business.findMany({
    include: {
      user: true,
      devices: true,
      _count: {
        select: { devices: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminBusinessesClient
      businesses={businesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category || "General",
        ownerName: b.user.name,
        ownerEmail: b.user.email,
        phone: b.phone || b.whatsapp || "No registrado",
        deviceCount: b._count.devices,
        createdAt: b.createdAt.toISOString(),
      }))}
    />
  );
}
