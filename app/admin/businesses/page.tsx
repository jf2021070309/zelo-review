import { query } from "@/lib/db";
import AdminBusinessesClient from "./AdminBusinessesClient";

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage() {
  const businessesRows = await query<any>(`
    SELECT 
      b.id, b.name, b.slug, b.category, b.phone, b.whatsapp, b.createdAt,
      u.name AS ownerName, u.email AS ownerEmail,
      COUNT(d.id) AS deviceCount
    FROM businesses b
    LEFT JOIN users u ON b.userId = u.id
    LEFT JOIN devices d ON d.businessId = b.id
    GROUP BY b.id, u.id
    ORDER BY b.createdAt DESC
  `);

  return (
    <AdminBusinessesClient
      businesses={businessesRows.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category || "General",
        ownerName: b.ownerName || "Administrador",
        ownerEmail: b.ownerEmail || "admin@zelo.pe",
        phone: b.phone || b.whatsapp || "No registrado",
        deviceCount: Number(b.deviceCount || 0),
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      }))}
    />
  );
}
