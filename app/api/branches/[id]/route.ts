import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { HttpError } from "@/lib/reviews";
import { validateBranch } from "@/lib/review-validators";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const existing = await queryOne<any>("SELECT * FROM branches WHERE id = ?", [params.id]);
    if (!existing) throw new HttpError(404, "Sucursal no encontrada");
    const v = await validateBranch({ ...existing, ...(await request.json()) });
    await execute(
      `UPDATE branches SET businessId = ?, managerId = ?, name = ?, address = ?, googleReviewUrl = ? WHERE id = ?`,
      [v.businessId, v.managerId, v.name, v.address, v.googleReviewUrl, params.id]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const used = await queryOne<any>("SELECT COUNT(*) AS n FROM qr_codes WHERE branchId = ?", [params.id]);
    if (Number(used?.n || 0) > 0) throw new HttpError(409, "Esta sucursal tiene QR asignados. Reasígnalos o elimínalos primero.");
    await execute("DELETE FROM branches WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
