import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";

import { db } from "@/lib/db";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import { PageHeader } from "@/components/shared/page-header";
import { MenuManager } from "@/components/restaurant/menu-manager";

export const dynamic = "force-dynamic";

export default async function RestaurantMenuPage() {
  const session = await getRestaurantSession();
  if (!session) redirect("/r/login");

  const [categories, items] = await Promise.all([
    db.menuCategory.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.menuItem.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={BookOpen}
        title="Menu"
        description="Organise your dishes into categories and keep availability up to date."
      />

      <MenuManager
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
        }))}
        initialItems={items.map((i) => ({
          id: i.id,
          categoryId: i.categoryId,
          name: i.name,
          description: i.description,
          price: i.price,
          imageUrl: i.imageUrl,
          imagePublicId: i.imagePublicId,
          isVeg: i.isVeg,
          isAvailable: i.isAvailable,
          sortOrder: i.sortOrder,
        }))}
      />
    </main>
  );
}
