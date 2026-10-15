import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const business = await queryOne(
    "SELECT * FROM businesses WHERE userId = ? ORDER BY createdAt DESC LIMIT 1",
    [user.id]
  );
  return NextResponse.json({ business });
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const business = await queryOne<any>(
      "SELECT * FROM businesses WHERE userId = ? ORDER BY createdAt DESC LIMIT 1",
      [user.id]
    );
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const data = await request.json();
    const { name, category, googleReviewUrl, phone, whatsapp, instagram, facebook, website, address, logoUrl } = data;

    await execute(
      `UPDATE businesses SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        googleReviewUrl = COALESCE(?, googleReviewUrl),
        phone = COALESCE(?, phone),
        whatsapp = COALESCE(?, whatsapp),
        instagram = COALESCE(?, instagram),
        facebook = COALESCE(?, facebook),
        website = COALESCE(?, website),
        address = COALESCE(?, address),
        logoUrl = COALESCE(?, logoUrl),
        updatedAt = NOW(3)
      WHERE id = ?`,
      [
        name || null,
        category || null,
        googleReviewUrl || null,
        phone || null,
        whatsapp || null,
        instagram || null,
        facebook || null,
        website || null,
        address || null,
        logoUrl || null,
        business.id,
      ]
    );

    const updated = await queryOne("SELECT * FROM businesses WHERE id = ? LIMIT 1", [business.id]);
    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    console.error("Business update error:", error);
    return NextResponse.json({ error: "Error al actualizar la información." }, { status: 500 });
  }
}
