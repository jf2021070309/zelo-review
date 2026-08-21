import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordScanEvent } from "@/lib/analytics";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase().trim();
  const searchParams = request.nextUrl.searchParams;
  const rawSource = searchParams.get("src")?.toUpperCase();

  let source: "QR" | "NFC" | "DIRECT" | "UNKNOWN" = "DIRECT";
  if (rawSource === "QR") source = "QR";
  else if (rawSource === "NFC") source = "NFC";

  const userAgent = request.headers.get("user-agent") || undefined;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

  try {
    const device = await prisma.device.findUnique({
      where: { code },
      include: {
        business: true,
        smartProfile: true,
      },
    });

    if (!device) {
      return NextResponse.redirect(new URL(`/claim/${code}?notfound=1`, request.url));
    }

    // Record scan asynchronously (non-blocking)
    recordScanEvent({
      deviceId: device.id,
      source: source,
      userAgent: userAgent,
      ip: ip,
    }).catch((err) => console.error("Scan logging error:", err));

    // Case 1: Unassigned / New Plate -> Send to Activation Claim Page
    if (device.status === "READY_TO_ASSIGN" || !device.businessId) {
      return NextResponse.redirect(new URL(`/claim/${device.code}`, request.url));
    }

    // Case 2: Suspended
    if (device.status === "SUSPENDED") {
      return new NextResponse(
        "Esta placa se encuentra temporalmente inactiva. Contacte al administrador.",
        { status: 403 }
      );
    }

    // Case 3: Smart Bio-Link Hub Mode
    if (device.mode === "SMART_PROFILE") {
      // Redirect to the interactive profile page
      return NextResponse.redirect(new URL(`/r/${device.code}/profile`, request.url));
    }

    // Case 4: Direct Redirect Mode (Google Reviews or Custom URL)
    const destination =
      device.customDestinationUrl ||
      device.business?.googleReviewUrl ||
      "https://search.google.com/local/writereview";

    return NextResponse.redirect(destination, { status: 302 });
  } catch (error) {
    console.error("Error in redirection route:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
