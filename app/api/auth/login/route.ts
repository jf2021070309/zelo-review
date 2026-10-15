import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { verifyPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresa tu correo y contraseña." },
        { status: 400 }
      );
    }

    const user = await queryOne<{
      id: string;
      email: string;
      password: string;
      name: string;
      role: string;
    }>("SELECT id, email, password, name, role FROM users WHERE email = ? LIMIT 1", [
      email.toLowerCase().trim(),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    const businesses = await query(
      "SELECT id, name, slug FROM businesses WHERE userId = ?",
      [user.id]
    );

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "BUSINESS_OWNER",
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businesses,
      },
      redirectTo: "/dashboard",
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión." },
      { status: 500 }
    );
  }
}
