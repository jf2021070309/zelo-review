import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-helpers";
import { getThread, postThreadMessage, inviteRerate, rerate, setCaseStatus, HttpError } from "@/lib/reviews";
import { getBaseUrlFromRequest } from "@/lib/app-url";

export const dynamic = "force-dynamic";

/** Hilo de conversación gerente ↔ cliente. El token define el rol. */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  try {
    const t = await getThread(params.token);
    if (!t) throw new HttpError(404, "Conversación no encontrada");
    return NextResponse.json(t);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const body = await request.json();
    const base = getBaseUrlFromRequest(request);
    switch (body.action) {
      case "message":
        return NextResponse.json(await postThreadMessage(params.token, String(body.body || ""), base));
      case "invite_rerate":
        return NextResponse.json(await inviteRerate(params.token, base));
      case "rerate":
        return NextResponse.json(await rerate(params.token, Number(body.rating), body.comment));
      case "status":
        return NextResponse.json(await setCaseStatus(params.token, body.status));
      default:
        throw new HttpError(400, "Acción no válida");
    }
  } catch (e) {
    return handleError(e);
  }
}
