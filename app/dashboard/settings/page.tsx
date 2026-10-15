import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = user.businesses[0];
  if (!business) redirect("/dashboard");

  return <SettingsClient business={business} userEmail={user.email} />;
}
