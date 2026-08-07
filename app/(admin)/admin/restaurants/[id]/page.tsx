import { notFound } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";

import { db } from "@/lib/db";
import { getRestaurantOrderUrl } from "@/lib/restaurant/qr";
import { PageHeader } from "@/components/shared/page-header";
import { RestaurantDetailPanel } from "@/components/restaurant/admin/restaurant-detail-panel";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantDetailPage({ params }: { params: { id: string } }) {
  const restaurant = await db.restaurant.findUnique({
    where: { id: params.id },
    include: {
      users: { where: { role: "OWNER" }, take: 1 },
      _count: { select: { categories: true, menuItems: true, tables: true, orders: true } },
    },
  });

  if (!restaurant) {
    notFound();
  }

  const owner = restaurant.users[0];

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={UtensilsCrossed}
        title={restaurant.branch ? `${restaurant.name} — ${restaurant.branch}` : restaurant.name}
        description={`${restaurant._count.menuItems} menu items · ${restaurant._count.tables} tables · ${restaurant._count.orders} orders`}
      />

      <RestaurantDetailPanel
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          branch: restaurant.branch,
          slug: restaurant.slug,
          phone: restaurant.phone,
          email: restaurant.email,
          address: restaurant.address,
          isActive: restaurant.isActive,
          ownerEmail: owner?.email ?? null,
          ownerName: owner?.name ?? null,
          orderUrl: getRestaurantOrderUrl(restaurant.slug),
        }}
      />
    </main>
  );
}
