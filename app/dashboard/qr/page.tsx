import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import QrStudioClient from "./QrStudioClient";

export default async function QrStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = user.businesses[0];
  if (!business) redirect("/dashboard");

  const devices = await prisma.device.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <QrStudioClient
      devices={devices.map((d) => ({
        id: d.id,
        code: d.code,
        status: d.status,
        mode: d.mode,
      }))}
      businessName={business.name}
    />
  );
}
