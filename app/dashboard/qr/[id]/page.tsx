import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import QrStudioClient from "../QrStudioClient";

export const dynamic = "force-dynamic";

export default async function QrDevicePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const devices = await query(
    "SELECT id, code, status, mode FROM devices ORDER BY createdAt DESC"
  );

  return (
    <QrStudioClient
      devices={devices.map((d: any) => ({
        id: d.id,
        code: d.code,
        status: d.status,
        mode: d.mode,
      }))}
      initialDeviceId={params.id}
      businessName="ZELO Review"
    />
  );
}
