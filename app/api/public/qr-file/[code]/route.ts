import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { ensureReviewSchema } from "@/lib/review-schema";
import { buildVCard, buildIcs } from "@/lib/qr-types";

export const dynamic = "force-dynamic";

/** Descarga .vcf (V-card) o .ics (Evento) de un QR dinámico. */
export async function GET(_request: Request, { params }: { params: { code: string } }) {
  await ensureReviewSchema();
  const qr = await queryOne<any>("SELECT * FROM qr_codes WHERE code = ? AND status = 'ACTIVE'", [params.code.toUpperCase()]);
  if (!qr || !["VCARD", "EVENT"].includes(qr.type)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const data = JSON.parse(qr.data || "{}");
  const isCard = qr.type === "VCARD";
  const content = isCard ? buildVCard(data) : buildIcs(data);
  const fname = (isCard ? [data.firstName, data.lastName].filter(Boolean).join("_") || "contacto" : data.title || "evento").replace(/[^\w\-]+/g, "_");
  return new NextResponse(content, {
    headers: {
      "Content-Type": isCard ? "text/vcard; charset=utf-8" : "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}.${isCard ? "vcf" : "ics"}"`,
    },
  });
}
