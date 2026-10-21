import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { HttpError, formatLimaDate } from "@/lib/reviews";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Envía un aviso de prueba al gerente por su canal configurado. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const mgr = await queryOne<any>("SELECT * FROM managers WHERE id = ?", [params.id]);
    if (!mgr) throw new HttpError(404, "Gerente no encontrado");
    const results = await notify({
      managerId: mgr.id,
      audience: "MANAGER",
      target: mgr,
      subject: "Prueba de avisos — ZELO Review",
      text: `✅ Hola ${mgr.name}, este es un aviso de prueba de ZELO Review (${formatLimaDate()}). Aquí te llegarán las alertas de reseñas negativas de tus sucursales.`,
    });
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return handleError(e);
  }
}
