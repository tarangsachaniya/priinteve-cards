import type { Metadata } from "next";

import { db } from "@/lib/db";
import { loadPublicMenu } from "@/lib/restaurant/public-menu";
import { ClosedNotice } from "@/components/order/closed-notice";
import { MenuBrowser } from "@/components/order/menu-browser";
import { RestoPage } from "@/components/order/resto-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await loadPublicMenu(params.slug);
  if (!data) return { title: "Restaurant not found" };

  const title = data.restaurant.branch
    ? `${data.restaurant.name} — ${data.restaurant.branch}`
    : data.restaurant.name;
  return { title: `${title} · Order online`, description: `Browse the menu and order from ${title}.` };
}

/**
 * What a table's QR code opens. The tableCode is random and unguessable, so
 * scanning one table's code can't be edited into another's.
 */
export default async function TableOrderPage({
  params,
}: {
  params: { slug: string; tableCode: string };
}) {
  const data = await loadPublicMenu(params.slug);

  if (!data) {
    return (
      <ClosedNotice
        title="Restaurant unavailable"
        message="This restaurant isn't accepting orders right now. Please check the link or try again later."
      />
    );
  }

  const table = await db.restaurantTable.findFirst({
    where: {
      code: params.tableCode,
      isActive: true,
      restaurant: { slug: params.slug },
    },
    select: { code: true, label: true },
  });

  if (!table) {
    return (
      <ClosedNotice
        title="Table not found"
        message="This QR code isn't linked to an active table. Please ask a staff member for help."
      />
    );
  }

  return (
    <RestoPage
      slug={data.restaurant.slug}
      brandColor={data.restaurant.brandColor}
      themeMode={data.restaurant.themeMode}
    >
      <MenuBrowser
        restaurant={data.restaurant}
        table={table}
        categories={data.categories}
        recommendedItemIds={data.recommendedItemIds}
      />
    </RestoPage>
  );
}
