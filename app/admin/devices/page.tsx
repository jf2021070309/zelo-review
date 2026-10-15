import { query } from "@/lib/db";
import AdminDevicesClient from "./AdminDevicesClient";

export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  const devicesRows = await query<any>(`
    SELECT 
      d.id, d.code, d.activationPin, d.status, d.mode, d.createdAt,
      b.name AS businessName,
      bt.name AS batchName,
      COUNT(se.id) AS totalScans
    FROM devices d
    LEFT JOIN businesses b ON d.businessId = b.id
    LEFT JOIN batches bt ON d.batchId = bt.id
    LEFT JOIN scan_events se ON se.deviceId = d.id
    GROUP BY d.id, b.name, bt.name
    ORDER BY d.createdAt DESC
  `);

  return (
    <AdminDevicesClient
      devices={devicesRows.map((d) => ({
        id: d.id,
        code: d.code,
        activationPin: d.activationPin,
        status: d.status,
        mode: d.mode,
        businessName: d.businessName || null,
        batchName: d.batchName || null,
        totalScans: Number(d.totalScans || 0),
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      }))}
    />
  );
}
