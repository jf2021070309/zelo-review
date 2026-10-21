import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-helpers";
import { submitReview } from "@/lib/reviews";
import { getBaseUrlFromRequest } from "@/lib/app-url";

export const dynamic = "force-dynamic";

/** Público: el cliente envía su calificación desde el QR. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitReview({
      code: String(body.code || ""),
      rating: Number(body.rating),
      comment: body.comment,
      authorName: body.authorName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      baseUrl: getBaseUrlFromRequest(request),
    });
    // No exponer detalles internos de los avisos al cliente
    if (result.outcome === "PRIVATE") {
      const { notified, ...rest } = result;
      return NextResponse.json({ ...rest, managerNotified: notified.some((n) => n.channel !== "WEBHOOK") });
    }
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
