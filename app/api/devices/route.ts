import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Si es ADMIN, puede ver todas las placas o las de sus negocios
  const businessIds = user.role === "ADMIN" 
    ? undefined 
    : user.businesses.map((b) => b.id);

  const whereCondition = businessIds ? { businessId: { in: businessIds } } : {};

  const devices = await prisma.device.findMany({
    where: whereCondition,
    include: {
      business: true,
      smartProfile: {
        include: { customLinks: true },
      },
      _count: {
        select: { scanEvents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calcular conteo exacto de QR vs NFC por placa
  const devicesWithStats = await Promise.all(
    devices.map(async (d) => {
      const qrScans = await prisma.scanEvent.count({
        where: { deviceId: d.id, source: "QR" },
      });
      const nfcScans = await prisma.scanEvent.count({
        where: { deviceId: d.id, source: "NFC" },
      });

      return {
        ...d,
        totalScans: d._count.scanEvents,
        qrScans,
        nfcScans,
      };
    })
  );

  return NextResponse.json({ devices: devicesWithStats });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      existingBusinessId,
      mode = "SMART_PROFILE", // "DIRECT_REDIRECT" (Estático) o "SMART_PROFILE" (Dinámico)
      staticDestinationType = "google", // google, facebook, instagram, website, whatsapp, custom
      customDestinationUrl,
      googleReviewUrl,
      facebook,
      instagram,
      website,
      whatsapp,
    } = body;

    if (!businessName && !existingBusinessId) {
      return NextResponse.json(
        { error: "Debe ingresar el nombre del negocio o seleccionar uno existente." },
        { status: 400 }
      );
    }

    // 1. Obtener o crear el Negocio
    let business;
    if (existingBusinessId && existingBusinessId !== "new") {
      business = await prisma.business.findUnique({
        where: { id: existingBusinessId },
      });
      if (business) {
        // Actualizar parámetros adicionales si se suministraron
        business = await prisma.business.update({
          where: { id: business.id },
          data: {
            googleReviewUrl: googleReviewUrl || business.googleReviewUrl,
            facebook: facebook || business.facebook,
            instagram: instagram || business.instagram,
            website: website || business.website,
            whatsapp: whatsapp || business.whatsapp,
          },
        });
      }
    }

    if (!business) {
      const finalName = businessName.trim();
      const baseSlug = finalName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "negocio";
      
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${baseSlug}-${randomSuffix}`;

      business = await prisma.business.create({
        data: {
          userId: user.id,
          name: finalName,
          slug: slug,
          category: "General",
          googleReviewUrl: googleReviewUrl || null,
          facebook: facebook || null,
          instagram: instagram || null,
          website: website || null,
          whatsapp: whatsapp || null,
        },
      });
    }

    // 2. Generar Código Único para la Placa derivado del nombre del negocio
    const namePrefix = business.name
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase() || "ZL";
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const plateCode = `ZL-${namePrefix}-${randomCode}`;
    const activationPin = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Determinar URL de destino si es modo Estático
    let finalDestinationUrl: string | null = null;
    if (mode === "DIRECT_REDIRECT") {
      if (staticDestinationType === "google") {
        finalDestinationUrl = googleReviewUrl || business.googleReviewUrl || "https://search.google.com/local/writereview";
      } else if (staticDestinationType === "facebook") {
        finalDestinationUrl = facebook || business.facebook || "https://facebook.com";
      } else if (staticDestinationType === "instagram") {
        const ig = instagram || business.instagram || "";
        finalDestinationUrl = ig.startsWith("http") ? ig : `https://instagram.com/${ig.replace("@", "")}`;
      } else if (staticDestinationType === "website") {
        finalDestinationUrl = website || business.website || "https://google.com";
      } else if (staticDestinationType === "whatsapp") {
        const num = (whatsapp || business.whatsapp || "").replace(/[^0-9]/g, "");
        finalDestinationUrl = num ? `https://wa.me/${num}` : "https://whatsapp.com";
      } else {
        finalDestinationUrl = customDestinationUrl || business.googleReviewUrl || "https://search.google.com/local/writereview";
      }
    }

    // 4. Crear la Placa (Device) en MySQL
    const device = await prisma.device.create({
      data: {
        code: plateCode,
        activationPin: activationPin,
        status: "ACTIVE",
        mode: mode as "DIRECT_REDIRECT" | "SMART_PROFILE",
        customDestinationUrl: finalDestinationUrl,
        businessId: business.id,
      },
    });

    // 5. Crear el SmartProfile con todos los datos y redes
    await prisma.smartProfile.create({
      data: {
        deviceId: device.id,
        title: business.name,
        description: "¡Gracias por visitarnos! Califica tu experiencia y conéctate con nuestras redes.",
        theme: "dark_gold",
        googleReviewUrl: googleReviewUrl || business.googleReviewUrl,
        googleReviewEnabled: true,
        facebookUrl: facebook || business.facebook,
        facebookEnabled: !!(facebook || business.facebook),
        instagramHandle: instagram || business.instagram,
        instagramEnabled: !!(instagram || business.instagram),
        websiteUrl: website || business.website,
        websiteEnabled: !!(website || business.website),
        whatsappNumber: whatsapp || business.whatsapp,
        whatsappEnabled: !!(whatsapp || business.whatsapp),
      },
    });

    const fullDevice = await prisma.device.findUnique({
      where: { id: device.id },
      include: {
        business: true,
        smartProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      device: fullDevice,
      qrUrl: `/r/${device.code}?src=qr`,
      nfcUrl: `/r/${device.code}?src=nfc`,
    });
  } catch (error: any) {
    console.error("Error creating device:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la placa en MySQL." },
      { status: 500 }
    );
  }
}
