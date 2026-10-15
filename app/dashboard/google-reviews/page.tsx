import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import GoogleReviewsToolClient from "./GoogleReviewsToolClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Generador de Enlaces Google Reviews (Place ID) | ZELO Review",
  description: "Convierte cualquier Google Place ID en el enlace oficial directo de 5 estrellas para tus placas inteligentes.",
};

export default async function GoogleReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <GoogleReviewsToolClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
