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
    const {
      mode,
      customDestinationUrl,
      status,
      businessName,
      googleReviewUrl,
      facebook,
      instagram,
      website,
      whatsapp,
      smartProfile,
    } = data;

    // 1. Actualizar negocio si se envió cambio de nombre o enlaces
    if (device.businessId && (businessName || googleReviewUrl !== undefined || facebook !== undefined || instagram !== undefined || website !== undefined || whatsapp !== undefined)) {
      await prisma.business.update({
        where: { id: device.businessId },
        data: {
          name: businessName || undefined,
          googleReviewUrl: googleReviewUrl !== undefined ? googleReviewUrl : undefined,
          facebook: facebook !== undefined ? facebook : undefined,
          instagram: instagram !== undefined ? instagram : undefined,
          website: website !== undefined ? website : undefined,
          whatsapp: whatsapp !== undefined ? whatsapp : undefined,
        },
      });
    }

    // 2. Actualizar configuración central de la placa
    const updatedDevice = await prisma.device.update({
      where: { id: params.id },
      data: {
        mode: mode || undefined,
        customDestinationUrl: customDestinationUrl !== undefined ? customDestinationUrl : undefined,
        status: status || undefined,
      },
    });

    // 3. Upsert / Actualizar SmartProfile
    if (smartProfile || businessName || facebook || instagram || website || whatsapp || googleReviewUrl) {
      const existingProfile = await prisma.smartProfile.findUnique({
        where: { deviceId: params.id },
      });

      const spData = smartProfile || {};

      const profilePayload = {
        title: spData.title || businessName || undefined,
        description: spData.description !== undefined ? spData.description : undefined,
        theme: spData.theme || undefined,
        googleReviewUrl: spData.googleReviewUrl || googleReviewUrl || undefined,
        googleReviewEnabled: spData.googleReviewEnabled !== undefined ? spData.googleReviewEnabled : true,
        facebookUrl: spData.facebookUrl || facebook || undefined,
        facebookEnabled: spData.facebookEnabled !== undefined ? spData.facebookEnabled : !!(spData.facebookUrl || facebook),
        whatsappNumber: spData.whatsappNumber || whatsapp || undefined,
        whatsappMessage: spData.whatsappMessage || undefined,
        whatsappEnabled: spData.whatsappEnabled !== undefined ? spData.whatsappEnabled : !!(spData.whatsappNumber || whatsapp),
        instagramHandle: spData.instagramHandle || instagram || undefined,
        instagramEnabled: spData.instagramEnabled !== undefined ? spData.instagramEnabled : !!(spData.instagramHandle || instagram),
        websiteUrl: spData.websiteUrl || website || undefined,
        websiteEnabled: spData.websiteEnabled !== undefined ? spData.websiteEnabled : !!(spData.websiteUrl || website),
        menuUrl: spData.menuUrl !== undefined ? spData.menuUrl : undefined,
        menuEnabled: spData.menuEnabled !== undefined ? spData.menuEnabled : undefined,
        wifiSsid: spData.wifiSsid !== undefined ? spData.wifiSsid : undefined,
        wifiPassword: spData.wifiPassword !== undefined ? spData.wifiPassword : undefined,
        wifiEnabled: spData.wifiEnabled !== undefined ? spData.wifiEnabled : undefined,
        googleMapsUrl: spData.googleMapsUrl !== undefined ? spData.googleMapsUrl : undefined,
        googleMapsEnabled: spData.googleMapsEnabled !== undefined ? spData.googleMapsEnabled : undefined,
      };

      if (existingProfile) {
        await prisma.smartProfile.update({
          where: { deviceId: params.id },
          data: profilePayload,
        });

        if (Array.isArray(spData.customLinks)) {
          await prisma.smartLink.deleteMany({
            where: { profileId: existingProfile.id },
          });

          if (spData.customLinks.length > 0) {
            await prisma.smartLink.createMany({
              data: spData.customLinks.map((link: any, index: number) => ({
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
            ...profilePayload,
            title: profilePayload.title || device.business?.name || "Mi Negocio",
          },
        });
      }
    }

    return NextResponse.json({ success: true, device: updatedDevice });
  } catch (error: any) {
    console.error("Device update error:", error);
    return NextResponse.json({ error: error.message || "Error al actualizar la configuración." }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.device.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Placa eliminada correctamente." });
  } catch (error: any) {
    console.error("Device delete error:", error);
    return NextResponse.json({ error: error.message || "Error al eliminar la placa." }, { status: 500 });
  }
}
