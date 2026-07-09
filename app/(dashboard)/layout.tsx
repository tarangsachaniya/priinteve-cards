import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar isAdmin={session?.user.role === "ADMIN"} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
