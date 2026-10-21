import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { HttpError } from "./reviews";
import { ensureReviewSchema } from "./review-schema";

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new HttpError(401, "No autorizado");
  await ensureReviewSchema();
  return session;
}

export function handleError(err: any) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[zelo-review]", err);
  return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
}

export function str(v: any, max = 255): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}
