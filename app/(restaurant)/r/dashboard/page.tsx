import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  IndianRupee,
  LayoutDashboard,
  QrCode,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import { getRestaurantOrderUrl } from "@/lib/restaurant/qr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { RevenueChart, type RevenuePoint } from "@/components/restaurant/revenue-chart";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

type Period = "day" | "month" | "year";

const PERIODS: { key: Period; tab: string; title: string }[] = [
  { key: "day", tab: "Daily", title: "Last 14 days" },
  { key: "month", tab: "Monthly", title: "Last 12 months" },
  { key: "year", tab: "Yearly", title: "Last 5 years" },
];

function parsePeriod(value: string | undefined): Period {
  return value === "month" || value === "year" ? value : "day";
}

/**
 * The left edge of every bucket, oldest first.
 *
 * Months and years are built from the calendar rather than by subtracting a
 * fixed number of days, so a 28-day February and a leap year both land on the
 * right boundary instead of drifting.
 */
function bucketStarts(period: Period, now: Date): Date[] {
  if (period === "day") {
    const today = startOfDay(now);
    return Array.from({ length: 14 }, (_, i) => new Date(today.getTime() - (13 - i) * DAY_MS));
  }
  if (period === "month") {
    return Array.from(
      { length: 12 },
      (_, i) => new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    );
  }
  return Array.from({ length: 5 }, (_, i) => new Date(now.getFullYear() - (4 - i), 0, 1));
}

function bucketEnd(period: Period, start: Date): Date {
  if (period === "day") return new Date(start.getTime() + DAY_MS);
  if (period === "month") return new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return new Date(start.getFullYear() + 1, 0, 1);
}

function bucketLabel(period: Period, start: Date): string {
  if (period === "day") {
    return start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  if (period === "month") {
    return start.toLocaleDateString("en-IN", { month: "short" });
  }
  return String(start.getFullYear());
}

export default async function RestaurantDashboardPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const session = await getRestaurantSession();
  if (!session) redirect("/r/login");

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { name: true, branch: true, slug: true },
  });
  if (!restaurant) redirect("/r/login");

  const now = new Date();
  const today = startOfDay(now);
  const period = parsePeriod(searchParams.period);
  const starts = bucketStarts(period, now);
  const trendStart = starts[0];

  const [todayOrders, trendOrders, liveCount, menuItemCount, tableCount] = await Promise.all([
    db.restoOrder.findMany({
      where: {
        restaurantId: session.restaurantId,
        placedAt: { gte: today },
        status: { not: "CANCELLED" },
      },
      select: { total: true },
    }),
    db.restoOrder.findMany({
      where: {
        restaurantId: session.restaurantId,
        placedAt: { gte: trendStart },
        status: { not: "CANCELLED" },
      },
      select: { total: true, placedAt: true },
    }),
    db.restoOrder.count({
      where: {
        restaurantId: session.restaurantId,
        status: { in: ["PLACED", "ACCEPTED", "PREPARING", "READY"] },
      },
    }),
    db.menuItem.count({ where: { restaurantId: session.restaurantId } }),
    db.restaurantTable.count({ where: { restaurantId: session.restaurantId, isActive: true } }),
  ]);

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrder =
    todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;

  // One bucket per period step, oldest first, so an empty day or month still
  // shows as a zero rather than being skipped in the chart.
  const trend: RevenuePoint[] = starts.map((start) => {
    const end = bucketEnd(period, start);
    const bucketOrders = trendOrders.filter(
      (order) => order.placedAt >= start && order.placedAt < end
    );
    return {
      label: bucketLabel(period, start),
      revenue: bucketOrders.reduce((sum, order) => sum + order.total, 0),
      orders: bucketOrders.length,
    };
  });

  const periodRevenue = trendOrders.reduce((sum, order) => sum + order.total, 0);
  const activePeriod = PERIODS.find((p) => p.key === period) ?? PERIODS[0];

  const stats = [
    {
      key: "orders",
      label: "Orders today",
      value: String(todayOrders.length),
      icon: ReceiptText,
      description: `${liveCount} in the kitchen now`,
    },
    {
      key: "revenue",
      label: "Revenue today",
      value: formatCurrency(todayRevenue),
      icon: IndianRupee,
      description: "Excludes cancelled orders",
    },
    {
      key: "average",
      label: "Average order",
      value: formatCurrency(averageOrder),
      icon: TrendingUp,
      description: "Today's average bill",
    },
    {
      key: "setup",
      label: "Menu & tables",
      value: `${menuItemCount} · ${tableCount}`,
      icon: BookOpen,
      description: "Items and active tables",
    },
  ];

  const needsSetup = menuItemCount === 0 || tableCount === 0;

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={LayoutDashboard}
        title="Overview"
        description={
          restaurant.branch ? `${restaurant.name} — ${restaurant.branch}` : restaurant.name
        }
        action={
          <Button size="sm" render={<Link href="/r/orders" />}>
            <ReceiptText data-icon="inline-start" />
            Open orders board
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        {needsSetup && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Finish setting up</p>
                <p className="text-sm text-muted-foreground">
                  {menuItemCount === 0
                    ? "Add your menu so customers have something to order."
                    : "Add your tables to generate QR codes."}
                </p>
              </div>
              <Button
                size="sm"
                render={<Link href={menuItemCount === 0 ? "/r/menu" : "/r/tables"} />}
              >
                {menuItemCount === 0 ? "Build the menu" : "Add tables"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ key, label, value, icon: Icon, description }) => (
            <Card key={key} className="border-border/80">
              <CardContent className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tracking-tight">{value}</p>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/80">
          <CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row">
            <div>
              <CardTitle className="text-base">
                Earnings · {formatCurrency(periodRevenue)}
              </CardTitle>
              <CardDescription>
                {activePeriod.title} — orders that weren&apos;t cancelled.
              </CardDescription>
            </div>

            {/* Links rather than buttons: the page is a server component, so
                switching period is a navigation and stays shareable. */}
            <nav aria-label="Earnings period" className="flex gap-1 rounded-full bg-muted p-1">
              {PERIODS.map(({ key, tab }) => (
                <Link
                  key={key}
                  href={`/r/dashboard?period=${key}`}
                  aria-current={key === period ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    key === period ? "bg-card shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {tab}
                </Link>
              ))}
            </nav>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="size-4" />
              Your ordering link
            </CardTitle>
            <CardDescription>
              Share this for take-away and delivery. Dine-in guests scan their table&apos;s own QR
              code.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <a
              href={getRestaurantOrderUrl(restaurant.slug)}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm underline-offset-4 hover:underline"
            >
              {getRestaurantOrderUrl(restaurant.slug)}
            </a>
            <Button variant="outline" size="sm" render={<Link href="/r/tables" />}>
              Manage table QR codes
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
