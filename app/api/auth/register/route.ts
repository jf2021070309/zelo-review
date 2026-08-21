import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, businessName, adminKey } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Por favor completa todos los campos requeridos." },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    
    // Determine role (Admin if registration key matches)
    const isAdmin = adminKey && adminKey === process.env.ADMIN_REGISTRATION_KEY;
    const role = isAdmin ? "ADMIN" : "BUSINESS_OWNER";

    // Create user and business in transaction
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        businesses: !isAdmin && businessName
          ? {
              create: {
                name: businessName,
                slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000),
                googleReviewUrl: "https://search.google.com/local/writereview",
              },
            }
          : undefined,
      },
      include: {
        businesses: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businesses: user.businesses,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al registrar el usuario. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
