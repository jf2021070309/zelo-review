import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { ensureReviewSchema } from "@/lib/review-schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await ensureReviewSchema();
  const f = await queryOne<any>("SELECT filename, mime, size, content FROM uploads WHERE id = ?", [params.id]);
  if (!f) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  const buf: Buffer = f.content;
  const base = {
    "Content-Type": f.mime,
    "Accept-Ranges": "bytes",
    "Content-Disposition": `inline; filename="${encodeURIComponent(f.filename)}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  // Soporte de Range (necesario para reproducir video en iPhone/Safari)
  const range = request.headers.get("range");
  const m = range?.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const start = m[1] ? parseInt(m[1], 10) : Math.max(0, buf.length - parseInt(m[2] || "0", 10));
    const end = m[1] && m[2] ? Math.min(parseInt(m[2], 10), buf.length - 1) : buf.length - 1;
    if (start >= buf.length || start > end) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${buf.length}` } });
    }
    return new NextResponse(new Uint8Array(buf.subarray(start, end + 1)), {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${buf.length}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new NextResponse(new Uint8Array(buf), { headers: { ...base, "Content-Length": String(buf.length) } });
}
