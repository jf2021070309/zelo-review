import LandingClient from "./LandingClient";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return <LandingClient isLoggedIn={!!session} userRole={session?.role} />;
}
