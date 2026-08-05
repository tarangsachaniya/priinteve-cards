import Link from "next/link";
import { getServerSession } from "next-auth";
import { AlertTriangle, LayoutDashboard } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrSection } from "@/components/dashboard/qr-section";
import { PageHeader } from "@/components/shared/page-header";

const RENEWAL_WINDOW_DAYS = 30;

export default async function DashboardPage() {
  // The paid-access gate lives in the dashboard layout, which reads the plan
  // fresh from the database instead of trusting the session's cached flags.
  const session = await getServerSession(authOptions);

  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          slug: true,
          planId: true,
          planExpiresAt: true,
          plan: { select: { name: true, price: true, validityDays: true, featuresJson: true, maxGalleryImages: true, maxVideos: true, maxPdfs: true, maxFields: true } },
        },
      })
    : null;

  const daysUntilExpiry = user?.planExpiresAt
    ? Math.ceil((user.planExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const showRenewCta = daysUntilExpiry !== null && daysUntilExpiry <= RENEWAL_WINDOW_DAYS;
  const hasActivePlan = Boolean(user?.planId && user?.planExpiresAt && user.planExpiresAt > new Date());

  return (
    <main className="p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Manage your digital card and track how it's performing."
        action={
          hasActivePlan && (
            <Badge variant="secondary" className="h-7 px-3 text-sm">
              {user?.plan?.name} · Active
            </Badge>
          )
        }
      />

      {showRenewCta && user?.planExpiresAt && (
        <Card className="max-w-md border-primary/40 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-ink">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <p className="font-semibold">
                  {daysUntilExpiry! < 0 ? "Your plan has expired" : "Your plan is expiring soon"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.plan?.name ?? "Plan"} expires on {formatDate(user.planExpiresAt)}
                </p>
              </div>
            </div>
            <Button render={<Link href="/plans" />}>Renew</Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" render={<Link href="/dashboard/builder" />}>
          Edit my card
        </Button>
        {user?.slug && (
          <Button variant="outline" render={<a href={`/${user.slug}`} target="_blank" rel="noreferrer" />}>
            View public card
          </Button>
        )}
      </div>

      {user?.plan && (
        <Card className="mt-6 max-w-3xl"><CardContent className="space-y-4">
          <div><p className="text-sm text-muted-foreground">Your plan</p><h2 className="text-xl font-semibold">{user.plan.name}</h2><p className="text-sm text-muted-foreground">₹{user.plan.price} · {user.plan.validityDays} days · {user.planExpiresAt ? `Renews/expires ${formatDate(user.planExpiresAt)}` : "No expiry set"}</p></div>
          <div className="flex flex-wrap gap-2 text-sm"><Badge variant="outline">{user.plan.maxFields} fields</Badge><Badge variant="outline">{user.plan.maxGalleryImages} images</Badge><Badge variant="outline">{user.plan.maxVideos} videos</Badge><Badge variant="outline">{user.plan.maxPdfs} PDFs</Badge></div>
          {Array.isArray(user.plan.featuresJson) && <ul className="grid gap-1 text-sm sm:grid-cols-2">{user.plan.featuresJson.filter((feature): feature is string => typeof feature === "string").map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>}
        </CardContent></Card>
      )}

      {session?.user.cardPublished && user?.slug && <QrSection slug={user.slug} />}
    </main>
  );
}
