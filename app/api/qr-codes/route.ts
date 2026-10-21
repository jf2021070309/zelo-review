import { NextResponse } from "next/server";
import crypto from "crypto";
import { query, execute, queryOne } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { validateQrBody } from "@/lib/qr-store";
import { generateRandomCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

function mapRow(r: any) {
  let data = {};
  let design = null;
  try { data = JSON.parse(r.data || "{}"); } catch {}
  try { design = r.design ? JSON.parse(r.design) : null; } catch {}
  return {
    id: r.id, code: r.code, name: r.name, type: r.type, isDynamic: Boolean(r.isDynamic), status: r.status,
    data, design, branchId: r.branchId, branchName: r.branchName || null,
    scans: Number(r.scans || 0), reviews: Number(r.reviews || 0),
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  };
}

export async function GET() {
  try {
    await requireSession();
    const rows = await query<any>(
      `SELECT q.*, b.name AS branchName,
              (SELECT COUNT(*) FROM qr_scans s WHERE s.qrId = q.id) AS scans,
              (SELECT COUNT(*) FROM reviews r WHERE r.qrId = q.id) AS reviews
       FROM qr_codes q LEFT JOIN branches b ON b.id = q.branchId
       ORDER BY q.createdAt DESC`
    );
    return NextResponse.json({ qrCodes: rows.map(mapRow) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const v = await validateQrBody(await request.json());
    const id = crypto.randomUUID();
    let code = "";
    for (let i = 0; i < 8; i++) {
      code = generateRandomCode("Q", 7);
      const exists = await queryOne<any>("SELECT id FROM qr_codes WHERE code = ?", [code]);
      if (!exists) break;
    }
    await execute(
      `INSERT INTO qr_codes (id, code, name, type, isDynamic, data, design, businessId, branchId, status, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, code, v.name, v.type, v.isDynamic, v.data, v.design, v.businessId, v.branchId, v.status, session.userId]
    );
    const row = await queryOne<any>("SELECT * FROM qr_codes WHERE id = ?", [id]);
    return NextResponse.json({ ok: true, qrCode: mapRow(row) }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
