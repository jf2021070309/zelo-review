import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryOne, query } from "@/lib/db";
import { createBatchPrintZip, BatchExportItem } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 403 });
    }

    const batch = await queryOne<any>(
      "SELECT * FROM batches WHERE id = ? LIMIT 1",
      [params.id]
    );

    if (!batch) {
      return new NextResponse("Lote no encontrado", { status: 404 });
    }

    const devices = await query<any>(
      "SELECT code, activationPin FROM devices WHERE batchId = ? ORDER BY code ASC",
      [batch.id]
    );

    const host = request.nextUrl.origin || "https://review.zelo.com.mx";

    const exportItems: BatchExportItem[] = devices.map((device) => ({
      code: device.code,
      pin: device.activationPin,
      qrUrl: `${host}/r/${device.code}?src=qr`,
      nfcUrl: `${host}/r/${device.code}?src=nfc`,
      batchId: batch.id,
    }));

    const zipBuffer = await createBatchPrintZip(exportItems, batch.name);

    const filename = `ZELO_${batch.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_PRODUCCION.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Batch export error:", error);
    return new NextResponse("Error al generar el archivo ZIP de producción.", { status: 500 });
  }
}
