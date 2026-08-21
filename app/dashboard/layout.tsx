import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const currentBusiness = user.businesses[0] || null;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col md:flex-row">
      <DashboardNav user={user} business={currentBusiness} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
