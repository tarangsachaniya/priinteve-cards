import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { LayoutDashboard } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrSection } from "@/components/dashboard/qr-section";
import { PageHeader } from "@/components/shared/page-header";

const RENEWAL_WINDOW_DAYS = 30;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role === "USER" && !session.user.cardPublished) {
    redirect("/dashboard/setup");
  }

  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true, planExpiresAt: true, plan: { select: { name: true } } },
      })
    : null;

  const daysUntilExpiry = user?.planExpiresAt
    ? Math.ceil((user.planExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const showRenewCta = daysUntilExpiry !== null && daysUntilExpiry <= RENEWAL_WINDOW_DAYS;

  return (
    <main className="p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={LayoutDashboard}
        title="Overview"
        description="Manage your digital card and track how it's performing."
      />

      {showRenewCta && user?.planExpiresAt && (
        <Card className="mt-4 max-w-md">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {daysUntilExpiry! < 0 ? "Your plan has expired" : "Your plan is expiring soon"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user.plan?.name ?? "Plan"} expires on {user.planExpiresAt.toDateString()}
              </p>
            </div>
            <Button render={<Link href="/dashboard/plans" />}>Renew</Button>
          </CardContent>
        </Card>
      )}

      {session?.user.cardPublished && user?.slug && <QrSection slug={user.slug} />}
    </main>
  );
}
