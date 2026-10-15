import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeDataUrl, generateQRCodeSVG } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const format = searchParams.get("format") || "png"; // png, svg, dataurl
  const code = searchParams.get("code") || "QR";
  const isDownload = searchParams.get("download") === "1" || searchParams.get("asAttachment") === "1";

  if (!text) {
    return NextResponse.json({ error: "Parámetro 'text' es obligatorio" }, { status: 400 });
  }

  try {
    if (format === "svg") {
      const svg = await generateQRCodeSVG(text, { width: 1000, margin: 1 });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": isDownload
            ? `attachment; filename="${code}_QR.svg"`
            : "inline",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const dataUrl = await generateQRCodeDataUrl(text, { width: 1000, margin: 1 });
    
    // Si explícitamente se solicita JSON
    if (format === "dataurl_json") {
      return NextResponse.json({ dataUrl });
    }

    // Por defecto retornar la imagen PNG binaria para etiquetas <img src="..."> y descargas
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": isDownload
          ? `attachment; filename="${code}_QR.png"`
          : "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
