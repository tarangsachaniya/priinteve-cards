import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";

import { db } from "@/lib/db";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import { getRestaurantOrderUrl } from "@/lib/restaurant/qr";
import { PageHeader } from "@/components/shared/page-header";
import { TablesManager } from "@/components/restaurant/tables-manager";

export const dynamic = "force-dynamic";

export default async function RestaurantTablesPage() {
  const session = await getRestaurantSession();
  if (!session) redirect("/r/login");

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { slug: true, takeAwayEnabled: true, deliveryEnabled: true },
  });
  if (!restaurant) redirect("/r/login");

  const tables = await db.restaurantTable.findMany({
    where: { restaurantId: session.restaurantId },
    orderBy: { createdAt: "asc" },
  });

  // getRestaurantOrderUrl already resolves the deployment origin; strip the
  // path so the client can build per-table links without duplicating it.
  const baseUrl = getRestaurantOrderUrl(restaurant.slug).replace(
    `/order/${restaurant.slug}`,
    ""
  );

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={QrCode}
        title="Tables & QR"
        description="Every table gets a unique QR code that opens your menu."
      />

      <TablesManager
        initialTables={tables.map((t) => ({
          id: t.id,
          label: t.label,
          code: t.code,
          seats: t.seats,
          isActive: t.isActive,
        }))}
        restaurantSlug={restaurant.slug}
        baseUrl={baseUrl}
        offersTakeaway={restaurant.takeAwayEnabled || restaurant.deliveryEnabled}
      />
    </main>
  );
}
