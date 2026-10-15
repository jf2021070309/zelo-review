import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeDataUrl, generateQRCodeSVG } from "@/lib/qr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const format = searchParams.get("format") || "png"; // png, svg, dataurl
  const code = searchParams.get("code") || "QR";

  if (!text) {
    return NextResponse.json({ error: "Parámetro 'text' es obligatorio" }, { status: 400 });
  }

  try {
    if (format === "svg") {
      const svg = await generateQRCodeSVG(text, { width: 1000, margin: 1 });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="${code}_QR.svg"`,
        },
      });
    }

    const dataUrl = await generateQRCodeDataUrl(text, { width: 1000, margin: 1 });
    
    if (format === "dataurl") {
      return NextResponse.json({ dataUrl });
    }

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${code}_QR.png"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
