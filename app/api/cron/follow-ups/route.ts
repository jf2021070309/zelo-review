import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleError } from "@/lib/api-helpers";
import { runFollowUps, HttpError } from "@/lib/reviews";
import { getBaseUrlFromRequest } from "@/lib/app-url";

export const dynamic = "force-dynamic";

/**
 * Procesa el recordatorio único y el seguimiento a los 2 días.
 * Programarlo (cron del VPS o nodo Schedule de n8n) cada 15–60 min:
 *   curl -s "https://TU_DOMINIO/api/cron/follow-ups?key=$CRON_SECRET"
 */
async function handle(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key") || request.headers.get("x-cron-key");
    const ok = (process.env.CRON_SECRET && key === process.env.CRON_SECRET) || (await getSession());
    if (!ok) throw new HttpError(401, "No autorizado");
    const result = await runFollowUps(getBaseUrlFromRequest(request));
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return handleError(e);
  }
}

export const GET = handle;
export const POST = handle;
