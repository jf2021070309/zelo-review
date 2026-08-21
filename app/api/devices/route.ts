import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const business = user.businesses[0];
  if (!business) {
    return NextResponse.json({ devices: [] });
  }

  const devices = await prisma.device.findMany({
    where: { businessId: business.id },
    include: {
      smartProfile: {
        include: { customLinks: true },
      },
      _count: {
        select: { scanEvents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ devices });
}
