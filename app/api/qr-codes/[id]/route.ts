import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { validateQrBody } from "@/lib/qr-store";
import { HttpError } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const existing = await queryOne<any>("SELECT * FROM qr_codes WHERE id = ?", [params.id]);
    if (!existing) throw new HttpError(404, "QR no encontrado");
    const body = await request.json();
    // Solo cambio de estado (pausar / activar)
    if (Object.keys(body).length === 1 && body.status) {
      await execute("UPDATE qr_codes SET status = ? WHERE id = ?", [body.status === "PAUSED" ? "PAUSED" : "ACTIVE", params.id]);
      return NextResponse.json({ ok: true });
    }
    const merged = {
      type: existing.type,
      name: existing.name,
      isDynamic: Boolean(existing.isDynamic),
      data: JSON.parse(existing.data || "{}"),
      design: existing.design ? JSON.parse(existing.design) : null,
      status: existing.status,
      ...body,
    };
    const v = await validateQrBody(merged);
    await execute(
      `UPDATE qr_codes SET name = ?, type = ?, isDynamic = ?, data = ?, design = ?, businessId = ?, branchId = ?, status = ? WHERE id = ?`,
      [v.name, v.type, v.isDynamic, v.data, v.design, v.businessId, v.branchId, v.status, params.id]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    await execute("DELETE FROM qr_scans WHERE qrId = ?", [params.id]);
    await execute("DELETE FROM qr_codes WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
