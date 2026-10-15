import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { recordScanEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

function getPublicDomain(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/+$/, "");
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";

  if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("3000")) {
    return `${proto}://${host}`;
  }

  return "https://review.zelo.com.mx";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase().trim();
  const searchParams = request.nextUrl.searchParams;
  const rawSource = searchParams.get("src")?.toUpperCase();
  const domain = getPublicDomain(request);

  let source: "QR" | "NFC" | "DIRECT" | "UNKNOWN" = "DIRECT";
  if (rawSource === "QR") source = "QR";
  else if (rawSource === "NFC") source = "NFC";

  const userAgent = request.headers.get("user-agent") || undefined;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

  try {
    const device = await queryOne<any>(
      `SELECT d.*, b.name as businessName, b.googleReviewUrl as businessGoogleReviewUrl
       FROM devices d
       LEFT JOIN businesses b ON d.businessId = b.id
       WHERE d.code = ?
       LIMIT 1`,
      [code]
    );

    if (!device) {
      return NextResponse.redirect(`${domain}/login`, { status: 302 });
    }

    // Record scan asynchronously (non-blocking)
    recordScanEvent({
      deviceId: device.id,
      source: source,
      userAgent: userAgent,
      ip: ip,
    }).catch((err) => console.error("Scan logging error:", err));

    // Case 1: Suspended
    if (device.status === "SUSPENDED") {
      return new NextResponse(
        "Esta placa se encuentra temporalmente inactiva. Contacte al administrador.",
        { status: 403 }
      );
    }

    // Case 2: Smart Bio-Link Hub Mode (Perfil dinámico)
    if (device.mode === "SMART_PROFILE") {
      return NextResponse.redirect(`${domain}/r/${device.code}/profile`, { status: 302 });
    }

    // Case 3: Direct Redirect Mode (Google Reviews o URL personalizada)
    const destination =
      device.customDestinationUrl ||
      device.businessGoogleReviewUrl ||
      "https://search.google.com/local/writereview";

    return NextResponse.redirect(destination, { status: 302 });
  } catch (error) {
    console.error("Error in redirection route:", error);
    return NextResponse.redirect(`${domain}/`, { status: 302 });
  }
}
