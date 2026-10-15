import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import { generateRandomCode, generatePin } from "@/lib/utils";
import crypto from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const batchesRows = await query<any>(`
    SELECT b.*, COUNT(d.id) AS deviceCount
    FROM batches b
    LEFT JOIN devices d ON d.batchId = b.id
    GROUP BY b.id
    ORDER BY b.createdAt DESC
  `);

  const batches = batchesRows.map((b) => ({
    ...b,
    _count: { devices: Number(b.deviceCount || 0) },
  }));

  return NextResponse.json({ batches });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { name, quantity, prefix, notes } = await request.json();

    const count = parseInt(quantity, 10);
    if (!name || isNaN(count) || count <= 0 || count > 500) {
      return NextResponse.json(
        { error: "Cantidad inválida. Máximo 500 placas por lote." },
        { status: 400 }
      );
    }

    const cleanPrefix = (prefix || "ZL").toUpperCase().trim();
    const batchId = crypto.randomUUID();

    await execute(
      `INSERT INTO batches (id, name, quantity, prefix, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW(3))`,
      [batchId, name, count, cleanPrefix, notes || null]
    );

    const usedCodes = new Set<string>();

    for (let i = 0; i < count; i++) {
      let code = generateRandomCode(cleanPrefix, 6);
      while (usedCodes.has(code)) {
        code = generateRandomCode(cleanPrefix, 6);
      }
      usedCodes.add(code);

      const pin = generatePin(4);
      const devId = crypto.randomUUID();

      await execute(
        `INSERT INTO devices (id, code, activationPin, status, mode, batchId, createdAt, updatedAt)
         VALUES (?, ?, ?, 'READY_TO_ASSIGN', 'DIRECT_REDIRECT', ?, NOW(3), NOW(3))`,
        [devId, code, pin, batchId]
      );
    }

    const batch = await queryOne("SELECT * FROM batches WHERE id = ? LIMIT 1", [batchId]);

    return NextResponse.json({
      success: true,
      batch,
      generatedCount: count,
    });
  } catch (error) {
    console.error("Batch creation error:", error);
    return NextResponse.json({ error: "Error al generar lote de placas." }, { status: 500 });
  }
}
