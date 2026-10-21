import { NextResponse } from "next/server";
import crypto from "crypto";
import { execute } from "@/lib/db";
import { requireSession, handleError } from "@/lib/api-helpers";
import { HttpError } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const MAX = 10 * 1024 * 1024;
const ALLOWED = /^(application\/pdf|image\/(png|jpe?g|gif|webp|svg\+xml)|video\/(mp4|webm|quicktime))$/;

/** Subida de archivos (PDF, imágenes, video) guardados en MySQL. */
export async function POST(request: Request) {
  try {
    await requireSession();
    const form = await request.formData();
    const files = form.getAll("file").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
    if (files.length === 0) throw new HttpError(400, "No se recibió ningún archivo");
    const out: { url: string; name: string; mime: string; size: number }[] = [];
    for (const f of files) {
      if (f.size > MAX) throw new HttpError(413, `"${f.name}" supera los 10 MB`);
      const mime = f.type || "application/octet-stream";
      if (!ALLOWED.test(mime)) throw new HttpError(415, `Tipo de archivo no permitido: ${mime}`);
      const id = crypto.randomUUID();
      const buf = Buffer.from(await f.arrayBuffer());
      await execute("INSERT INTO uploads (id, filename, mime, size, content) VALUES (?, ?, ?, ?, ?)", [id, f.name.slice(0, 250), mime, buf.length, buf]);
      out.push({ url: `/api/uploads/${id}`, name: f.name, mime, size: buf.length });
    }
    return NextResponse.json({ ok: true, files: out }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
