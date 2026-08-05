import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPastGracePeriod } from "@/lib/card-expiry";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { slug: true, planId: true, planExpiresAt: true },
  });

  if (!user) {
    redirect("/login");
  }

  // The dashboard is a paid surface. Read the plan from the database rather than
  // the session, which still holds whatever was true when the JWT was minted.
  // Admins manage the platform and are never gated on a purchase.
  if (session.user.role !== "ADMIN") {
    if (!user.planId || isPastGracePeriod(user.planExpiresAt)) {
      redirect("/plans");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted md:flex-row">
      <DashboardSidebar isAdmin={session.user.role === "ADMIN"} slug={user.slug} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
