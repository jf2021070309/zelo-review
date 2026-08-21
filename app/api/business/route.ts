import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const business = user.businesses[0];
  return NextResponse.json({ business });
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const business = user.businesses[0];
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const data = await request.json();
    const { name, category, googleReviewUrl, phone, whatsapp, instagram, website, address, logoUrl } = data;

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: name || undefined,
        category: category !== undefined ? category : undefined,
        googleReviewUrl: googleReviewUrl !== undefined ? googleReviewUrl : undefined,
        phone: phone !== undefined ? phone : undefined,
        whatsapp: whatsapp !== undefined ? whatsapp : undefined,
        instagram: instagram !== undefined ? instagram : undefined,
        website: website !== undefined ? website : undefined,
        address: address !== undefined ? address : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    console.error("Business update error:", error);
    return NextResponse.json({ error: "Error al actualizar la información." }, { status: 500 });
  }
}
