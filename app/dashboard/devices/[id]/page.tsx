import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import DeviceConfigClient from "./DeviceConfigClient";

export default async function DeviceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const device = await prisma.device.findUnique({
    where: { id: params.id },
    include: {
      business: true,
      smartProfile: {
        include: {
          customLinks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!device) notFound();

  // Guard: user must own business or be admin
  if (user.role !== "ADMIN" && device.business?.userId !== user.id) {
    redirect("/dashboard");
  }

  return (
    <DeviceConfigClient
      device={device}
      business={device.business || { name: "Negocio", googleReviewUrl: "" }}
    />
  );
}
