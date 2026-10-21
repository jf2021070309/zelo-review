import { NextResponse } from "next/server";
import { requireSession, handleError } from "@/lib/api-helpers";
import { getInbox, runFollowUps } from "@/lib/reviews";
import { getBaseUrlFromRequest } from "@/lib/app-url";
import { providersStatus } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireSession();
    // Procesar recordatorios/seguimientos pendientes cada vez que se abre la bandeja
    // (además del cron /api/cron/follow-ups).
    const followUps = await runFollowUps(getBaseUrlFromRequest(request)).catch(() => null);
    const inbox = await getInbox();
    return NextResponse.json({ ...inbox, followUps, providers: providersStatus() });
  } catch (e) {
    return handleError(e);
  }
}
