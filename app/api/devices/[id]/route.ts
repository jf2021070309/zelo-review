import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
      scanEvents: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: { scanEvents: true },
      },
    },
  });

  if (!device) {
    return NextResponse.json({ error: "Placa no encontrada" }, { status: 404 });
  }

  // Ensure user owns this device or is admin
  if (user.role !== "ADMIN" && device.business?.userId !== user.id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  return NextResponse.json({ device });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const device = await prisma.device.findUnique({
      where: { id: params.id },
      include: { business: true },
    });

    if (!device) {
      return NextResponse.json({ error: "Placa no encontrada" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && device.business?.userId !== user.id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const data = await request.json();
    const { mode, customDestinationUrl, status, smartProfile } = data;

    // 1. Update device core settings
    const updatedDevice = await prisma.device.update({
      where: { id: params.id },
      data: {
        mode: mode || undefined,
        customDestinationUrl: customDestinationUrl !== undefined ? customDestinationUrl : undefined,
        status: status || undefined,
      },
    });

    // 2. If smartProfile data provided, upsert SmartProfile
    if (smartProfile) {
      const existingProfile = await prisma.smartProfile.findUnique({
        where: { deviceId: params.id },
      });

      if (existingProfile) {
        await prisma.smartProfile.update({
          where: { deviceId: params.id },
          data: {
            title: smartProfile.title,
            description: smartProfile.description,
            theme: smartProfile.theme,
            googleReviewUrl: smartProfile.googleReviewUrl,
            googleReviewEnabled: smartProfile.googleReviewEnabled,
            whatsappNumber: smartProfile.whatsappNumber,
            whatsappMessage: smartProfile.whatsappMessage,
            whatsappEnabled: smartProfile.whatsappEnabled,
            instagramHandle: smartProfile.instagramHandle,
            instagramEnabled: smartProfile.instagramEnabled,
            websiteUrl: smartProfile.websiteUrl,
            websiteEnabled: smartProfile.websiteEnabled,
            menuUrl: smartProfile.menuUrl,
            menuEnabled: smartProfile.menuEnabled,
            wifiSsid: smartProfile.wifiSsid,
            wifiPassword: smartProfile.wifiPassword,
            wifiEnabled: smartProfile.wifiEnabled,
            googleMapsUrl: smartProfile.googleMapsUrl,
            googleMapsEnabled: smartProfile.googleMapsEnabled,
          },
        });

        // Update custom links if provided
        if (Array.isArray(smartProfile.customLinks)) {
          // Delete removed and upsert current
          await prisma.smartLink.deleteMany({
            where: { profileId: existingProfile.id },
          });

          if (smartProfile.customLinks.length > 0) {
            await prisma.smartLink.createMany({
              data: smartProfile.customLinks.map((link: any, index: number) => ({
                profileId: existingProfile.id,
                title: link.title || "Enlace",
                url: link.url || "https://",
                icon: link.icon || "globe",
                order: index,
                isActive: true,
              })),
            });
          }
        }
      } else {
        await prisma.smartProfile.create({
          data: {
            deviceId: params.id,
            title: smartProfile.title || device.business?.name,
            description: smartProfile.description,
            theme: smartProfile.theme || "dark_gold",
            googleReviewUrl: smartProfile.googleReviewUrl || device.business?.googleReviewUrl,
            googleReviewEnabled: smartProfile.googleReviewEnabled ?? true,
            whatsappNumber: smartProfile.whatsappNumber,
            whatsappMessage: smartProfile.whatsappMessage,
            whatsappEnabled: smartProfile.whatsappEnabled ?? false,
            instagramHandle: smartProfile.instagramHandle,
            instagramEnabled: smartProfile.instagramEnabled ?? false,
            websiteUrl: smartProfile.websiteUrl,
            websiteEnabled: smartProfile.websiteEnabled ?? false,
            menuUrl: smartProfile.menuUrl,
            menuEnabled: smartProfile.menuEnabled ?? false,
            wifiSsid: smartProfile.wifiSsid,
            wifiPassword: smartProfile.wifiPassword,
            wifiEnabled: smartProfile.wifiEnabled ?? false,
            googleMapsUrl: smartProfile.googleMapsUrl,
            googleMapsEnabled: smartProfile.googleMapsEnabled ?? false,
            customLinks: Array.isArray(smartProfile.customLinks)
              ? {
                  create: smartProfile.customLinks.map((l: any, i: number) => ({
                    title: l.title || "Enlace",
                    url: l.url || "https://",
                    icon: l.icon || "globe",
                    order: i,
                    isActive: true,
                  })),
                }
              : undefined,
          },
        });
      }
    }

    return NextResponse.json({ success: true, device: updatedDevice });
  } catch (error) {
    console.error("Device update error:", error);
    return NextResponse.json({ error: "Error al actualizar la configuración." }, { status: 500 });
  }
}
