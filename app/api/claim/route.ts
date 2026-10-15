import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession, hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { code, pin, businessName, email, password, googleReviewUrl } = await request.json();

    if (!code || !pin) {
      return NextResponse.json(
        { error: "Código de placa y PIN de activación requeridos." },
        { status: 400 }
      );
    }

    const device = await queryOne<any>(
      "SELECT * FROM devices WHERE code = ? LIMIT 1",
      [code.toUpperCase().trim()]
    );

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

    const session = await getSession();
    let businessId: string | null = null;
    let newAuthToken: string | null = null;

    if (session) {
      let userBusiness = await queryOne<any>(
        "SELECT id FROM businesses WHERE userId = ? LIMIT 1",
        [session.userId]
      );

      if (!userBusiness) {
        const newBusinessId = crypto.randomUUID();
        const slug = (businessName || "mi-negocio").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);
        await execute(
          `INSERT INTO businesses (id, userId, name, slug, googleReviewUrl, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [newBusinessId, session.userId, businessName || "Mi Negocio", slug, googleReviewUrl || "https://search.google.com/local/writereview"]
        );
        businessId = newBusinessId;
      } else {
        businessId = userBusiness.id;
      }
    } else {
      if (!email || !password || !businessName) {
        return NextResponse.json(
          { error: "Por favor completa tus datos para registrar y activar tu placa." },
          { status: 400 }
        );
      }

      let user = await queryOne<any>(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [email.toLowerCase().trim()]
      );

      if (!user) {
        const newUserId = crypto.randomUUID();
        const hashedPassword = await hashPassword(password);
        await execute(
          `INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'BUSINESS_OWNER', NOW(3), NOW(3))`,
          [newUserId, email.toLowerCase().trim(), hashedPassword, businessName]
        );
        user = { id: newUserId, email: email.toLowerCase().trim(), name: businessName, role: "BUSINESS_OWNER" };
      }

      const newBusinessId = crypto.randomUUID();
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);
      await execute(
        `INSERT INTO businesses (id, userId, name, slug, googleReviewUrl, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [newBusinessId, user.id, businessName, slug, googleReviewUrl || "https://search.google.com/local/writereview"]
      );

      businessId = newBusinessId;

      newAuthToken = signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    await execute(
      `UPDATE devices SET 
        status = 'ACTIVE', 
        businessId = ?, 
        customDestinationUrl = COALESCE(?, customDestinationUrl),
        updatedAt = NOW(3)
       WHERE id = ?`,
      [businessId, googleReviewUrl || null, device.id]
    );

    const updatedDevice = await queryOne("SELECT * FROM devices WHERE id = ? LIMIT 1", [device.id]);

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
