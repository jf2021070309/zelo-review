import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { code, pin, businessName, email, password, googleReviewUrl } = await request.json();

    if (!code || !pin) {
      return NextResponse.json(
        { error: "Código de placa y PIN de activación requeridos." },
        { status: 400 }
      );
    }

    const device = await prisma.device.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: { business: true },
    });

    if (!device) {
      return NextResponse.json(
        { error: "No se encontró ninguna placa con este código." },
        { status: 404 }
      );
    }

    if (device.activationPin !== pin.trim()) {
      return NextResponse.json(
        { error: "El PIN de activación es incorrecto. Verifica el código en tu empaque." },
        { status: 400 }
      );
    }

    if (device.status === "ACTIVE" && device.businessId) {
      return NextResponse.json(
        { error: "Esta placa ya se encuentra vinculada a un negocio activo." },
        { status: 400 }
      );
    }

    // Check if user is currently logged in
    const session = await getSession();
    let businessId: string | null = null;
    let newAuthToken: string | null = null;

    if (session) {
      // Use existing user's first business or create one
      let userBusiness = await prisma.business.findFirst({
        where: { userId: session.userId },
      });

      if (!userBusiness) {
        userBusiness = await prisma.business.create({
          data: {
            userId: session.userId,
            name: businessName || "Mi Negocio",
            slug: (businessName || "mi-negocio").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000),
            googleReviewUrl: googleReviewUrl || "https://search.google.com/local/writereview",
          },
        });
      }
      businessId = userBusiness.id;
    } else {
      // New user registration flow during claim
      if (!email || !password || !businessName) {
        return NextResponse.json(
          { error: "Por favor completa tus datos para registrar y activar tu placa." },
          { status: 400 }
        );
      }

      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        const hashedPassword = await hashPassword(password);
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase().trim(),
            name: businessName,
            password: hashedPassword,
            role: "BUSINESS_OWNER",
          },
        });
      }

      const business = await prisma.business.create({
        data: {
          userId: user.id,
          name: businessName,
          slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000),
          googleReviewUrl: googleReviewUrl || "https://search.google.com/local/writereview",
        },
      });

      businessId = business.id;

      newAuthToken = signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    // Activate and assign device
    const updatedDevice = await prisma.device.update({
      where: { id: device.id },
      data: {
        status: "ACTIVE",
        businessId: businessId,
        customDestinationUrl: googleReviewUrl || undefined,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: `¡Placa ${device.code} activada exitosamente!`,
      device: updatedDevice,
    });

    if (newAuthToken) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: newAuthToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Device claim error:", error);
    return NextResponse.json(
      { error: "Error al activar la placa. Inténtalo nuevamente." },
      { status: 500 }
    );
  }
}
