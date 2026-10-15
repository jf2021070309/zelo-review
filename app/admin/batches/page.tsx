import { query } from "@/lib/db";
import BatchesClient from "./BatchesClient";

export const dynamic = "force-dynamic";

export default async function AdminBatchesPage() {
  const batchesRows = await query<any>(`
    SELECT b.*, COUNT(d.id) AS deviceCount
    FROM batches b
    LEFT JOIN devices d ON d.batchId = b.id
    GROUP BY b.id
    ORDER BY b.createdAt DESC
  `);

  const batches = await Promise.all(
    batchesRows.map(async (b) => {
      const sampleDevices = await query<any>(
        "SELECT id, code, status, activationPin FROM devices WHERE batchId = ? LIMIT 5",
        [b.id]
      );
      return {
        id: b.id,
        name: b.name,
        quantity: b.quantity,
        prefix: b.prefix,
        notes: b.notes,
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        deviceCount: Number(b.deviceCount || 0),
        sampleDevices: sampleDevices || [],
      };
    })
  );

  return <BatchesClient batches={batches} />;
}
