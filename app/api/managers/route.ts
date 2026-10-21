import { NextResponse } from "next/server";
import crypto from "crypto";
import { query, execute } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { validateManager } from "@/lib/review-validators";
import { providersStatus } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const managers = await query<any>(
      `SELECT m.*, (SELECT COUNT(*) FROM branches b WHERE b.managerId = m.id) AS branchCount,
              (SELECT COUNT(*) FROM review_cases rc WHERE rc.managerId = m.id AND rc.status IN ('OPEN','IN_PROGRESS')) AS openCases
       FROM managers m ORDER BY m.createdAt ASC`
    );
    return NextResponse.json({
      managers: managers.map((m) => ({ ...m, isActive: Boolean(m.isActive), branchCount: Number(m.branchCount), openCases: Number(m.openCases) })),
      providers: providersStatus(),
    });
  } catch (e) {
    return handleError(e);
  }
}


export async function POST(request: Request) {
  try {
    await requireSession();
    const v = validateManager(await request.json());
    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO managers (id, businessId, name, role, channel, whatsapp, email, accessToken, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, v.businessId, v.name, v.role, v.channel, v.whatsapp, v.email, crypto.randomBytes(18).toString("base64url"), v.isActive]
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
