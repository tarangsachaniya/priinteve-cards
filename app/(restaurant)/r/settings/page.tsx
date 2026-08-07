import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { db } from "@/lib/db";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import { isRazorpayConfigured } from "@/lib/restaurant/payment";
import { PageHeader } from "@/components/shared/page-header";
import { HoursForm } from "@/components/restaurant/hours-form";
import { SettingsForm } from "@/components/restaurant/settings-form";

export const dynamic = "force-dynamic";

export default async function RestaurantSettingsPage() {
  const session = await getRestaurantSession();
  if (!session) redirect("/r/login");

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.restaurantId },
    include: { hours: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!restaurant) redirect("/r/login");

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Order types, payment options and how your restaurant appears to customers."
      />

      <SettingsForm
        razorpayConfigured={isRazorpayConfigured()}
        settings={{
          name: restaurant.name,
          branch: restaurant.branch,
          phone: restaurant.phone,
          email: restaurant.email,
          address: restaurant.address,
          brandColor: restaurant.brandColor,
          coverImageUrl: restaurant.coverImageUrl,
          coverPublicId: restaurant.coverPublicId,
          logoUrl: restaurant.logoUrl,
          logoPublicId: restaurant.logoPublicId,
          tagline: restaurant.tagline,
          description: restaurant.description,
          cuisineTags: restaurant.cuisineTags,
          prepTimeMinMins: restaurant.prepTimeMinMins,
          prepTimeMaxMins: restaurant.prepTimeMaxMins,
          costForTwo: restaurant.costForTwo,
          ratingValue: restaurant.ratingValue,
          ratingCount: restaurant.ratingCount,
          dineInEnabled: restaurant.dineInEnabled,
          takeAwayEnabled: restaurant.takeAwayEnabled,
          deliveryEnabled: restaurant.deliveryEnabled,
          onlinePaymentEnabled: restaurant.onlinePaymentEnabled,
          counterPaymentEnabled: restaurant.counterPaymentEnabled,
          taxPercent: restaurant.taxPercent,
          deliveryFee: restaurant.deliveryFee,
          minOrderValue: restaurant.minOrderValue,
        }}
      />

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Opening hours</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Customers see an Open or Closed badge on your menu, and orders are refused outside these
          hours.
        </p>
        <HoursForm
          initial={{
            timezone: restaurant.timezone,
            acceptingOrders: restaurant.acceptingOrders,
            closedMessage: restaurant.closedMessage,
            hours: restaurant.hours.map(({ dayOfWeek, opensAt, closesAt, isClosed }) => ({
              dayOfWeek,
              opensAt,
              closesAt,
              isClosed,
            })),
          }}
        />
      </section>
    </main>
  );
}
