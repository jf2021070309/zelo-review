import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { HttpError } from "@/lib/reviews";
import { validateManager } from "@/lib/review-validators";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const existing = await queryOne<any>("SELECT * FROM managers WHERE id = ?", [params.id]);
    if (!existing) throw new HttpError(404, "Gerente no encontrado");
    const body = await request.json();
    const v = validateManager({ ...existing, isActive: Boolean(existing.isActive), ...body });
    await execute(
      `UPDATE managers SET businessId = ?, name = ?, role = ?, channel = ?, whatsapp = ?, email = ?, isActive = ? WHERE id = ?`,
      [v.businessId, v.name, v.role, v.channel, v.whatsapp, v.email, v.isActive, params.id]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    await execute("UPDATE branches SET managerId = NULL WHERE managerId = ?", [params.id]);
    await execute("DELETE FROM managers WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
