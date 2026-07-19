import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id
    ? await db.user.findUnique({ where: { id: session.user.id }, select: { slug: true } })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-muted md:flex-row">
      <DashboardSidebar isAdmin={session?.user.role === "ADMIN"} slug={user?.slug} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
