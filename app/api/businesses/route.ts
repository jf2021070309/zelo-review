import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const businesses = await query(`
    SELECT b.*, COUNT(d.id) AS deviceCount
    FROM businesses b
    LEFT JOIN devices d ON d.businessId = b.id
    GROUP BY b.id
    ORDER BY b.createdAt DESC
  `);

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
    const businessId = crypto.randomUUID();

    await execute(
      `INSERT INTO businesses (id, userId, name, slug, category, googleReviewUrl, phone, whatsapp, instagram, facebook, website, address, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [
        businessId,
        user.id,
        name.trim(),
        slug,
        category,
        googleReviewUrl || null,
        phone || null,
        whatsapp || null,
        instagram || null,
        facebook || null,
        website || null,
        address || null,
      ]
    );

    const business = await queryOne("SELECT * FROM businesses WHERE id = ? LIMIT 1", [businessId]);

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    console.error("Error creating business:", error);
    return NextResponse.json({ error: error.message || "Error al crear negocio." }, { status: 500 });
  }
}
