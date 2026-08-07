import { UtensilsCrossed, CheckCircle2, CircleSlash, ReceiptText } from "lucide-react";

import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { RestaurantsTable } from "@/components/restaurant/admin/restaurants-table";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantsPage() {
  const restaurants = await db.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { where: { role: "OWNER" }, select: { email: true }, take: 1 },
      _count: { select: { tables: true, menuItems: true, orders: true } },
    },
  });

  const stats = [
    {
      key: "total",
      label: "Restaurants",
      value: restaurants.length,
      icon: UtensilsCrossed,
      description: "All restaurants",
    },
    {
      key: "active",
      label: "Live",
      value: restaurants.filter((r) => r.isActive).length,
      icon: CheckCircle2,
      description: "Accepting orders",
    },
    {
      key: "paused",
      label: "Paused",
      value: restaurants.filter((r) => !r.isActive).length,
      icon: CircleSlash,
      description: "Hidden from customers",
    },
    {
      key: "orders",
      label: "Total orders",
      value: restaurants.reduce((sum, r) => sum + r._count.orders, 0),
      icon: ReceiptText,
      description: "Across all restaurants",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={UtensilsCrossed}
        title="Restaurants"
        description="Create restaurants and manage their ordering accounts."
      />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

        <RestaurantsTable
          initialRestaurants={restaurants.map((r) => ({
            id: r.id,
            name: r.name,
            branch: r.branch,
            slug: r.slug,
            phone: r.phone,
            isActive: r.isActive,
            ownerEmail: r.users[0]?.email ?? null,
            tableCount: r._count.tables,
            menuItemCount: r._count.menuItems,
            orderCount: r._count.orders,
            createdAt: r.createdAt,
          }))}
        />
      </div>
    </main>
  );
}
