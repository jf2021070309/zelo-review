import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const businesses = await prisma.business.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: {
      _count: {
        select: { devices: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ businesses });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { name, category = "General", googleReviewUrl, phone, whatsapp, instagram, facebook, website, address } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre del negocio es obligatorio." }, { status: 400 });
    }

    const baseSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    const business = await prisma.business.create({
      data: {
        userId: user.id,
        name: name.trim(),
        slug,
        category,
        googleReviewUrl: googleReviewUrl || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        facebook: facebook || null,
        website: website || null,
        address: address || null,
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    console.error("Error creating business:", error);
    return NextResponse.json({ error: error.message || "Error al crear negocio." }, { status: 500 });
  }
}
