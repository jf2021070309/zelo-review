import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRandomCode, generatePin } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const batches = await prisma.batch.findMany({
    include: {
      _count: {
        select: { devices: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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

    // Create batch and generate unique plates
    const batch = await prisma.batch.create({
      data: {
        name,
        quantity: count,
        prefix: cleanPrefix,
        notes: notes || undefined,
      },
    });

    const devicesData = [];
    const usedCodes = new Set<string>();

    for (let i = 0; i < count; i++) {
      let code = generateRandomCode(cleanPrefix, 6);
      while (usedCodes.has(code)) {
        code = generateRandomCode(cleanPrefix, 6);
      }
      usedCodes.add(code);

      const pin = generatePin(4);

      devicesData.push({
        code,
        activationPin: pin,
        status: "READY_TO_ASSIGN" as const,
        mode: "DIRECT_REDIRECT" as const,
        batchId: batch.id,
      });
    }

    await prisma.device.createMany({
      data: devicesData,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      batch,
      generatedCount: devicesData.length,
    });
  } catch (error) {
    console.error("Batch creation error:", error);
    return NextResponse.json({ error: "Error al generar lote de placas." }, { status: 500 });
  }
}
