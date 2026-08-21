import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import QrStudioClient from "../QrStudioClient";

export default async function QrDevicePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = user.businesses[0];
  if (!business) redirect("/dashboard");

  const devices = await prisma.device.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  const selectedDevice = devices.find((d) => d.id === params.id);
  if (!selectedDevice && devices.length > 0) {
    // If not found, use first
  }

  return (
    <QrStudioClient
      devices={devices.map((d) => ({
        id: d.id,
        code: d.code,
        status: d.status,
        mode: d.mode,
      }))}
      initialDeviceId={params.id}
      businessName={business.name}
    />
  );
}
