import { NextResponse } from "next/server";
import crypto from "crypto";
import { query, execute } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { validateBranch } from "@/lib/review-validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const branches = await query<any>(
      `SELECT b.*, m.name AS managerName, m.channel AS managerChannel, m.whatsapp AS managerWhatsapp, m.email AS managerEmail,
              (SELECT COUNT(*) FROM qr_codes q WHERE q.branchId = b.id) AS qrCount
       FROM branches b LEFT JOIN managers m ON m.id = b.managerId
       ORDER BY b.createdAt ASC`
    );
    const businesses = await query<any>("SELECT id, name, googleReviewUrl FROM businesses ORDER BY name ASC");
    return NextResponse.json({ branches: branches.map((b) => ({ ...b, qrCount: Number(b.qrCount) })), businesses });
  } catch (e) {
    return handleError(e);
  }
}


export async function POST(request: Request) {
  try {
    await requireSession();
    const v = await validateBranch(await request.json());
    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO branches (id, businessId, managerId, name, address, googleReviewUrl) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, v.businessId, v.managerId, v.name, v.address, v.googleReviewUrl]
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
