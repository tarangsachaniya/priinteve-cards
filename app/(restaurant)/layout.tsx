import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import { RestaurantSidebar } from "@/components/restaurant/restaurant-sidebar";

/**
 * The guard for the whole restaurant console.
 *
 * Deliberately enforced here rather than in middleware.ts: the card product's
 * middleware knows only about NextAuth tokens, and extending it would mean
 * editing a file shared with the existing app. A layout-level redirect gives
 * the same protection with zero coupling.
 */
export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const session = await getRestaurantSession();
  if (!session) {
    redirect("/r/login");
  }

  // Read the restaurant from the database, not the cookie: an account that
  // was paused after the session was minted must lose access immediately.
  const restaurant = await db.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { name: true, isActive: true },
  });

  if (!restaurant || !restaurant.isActive) {
    redirect("/r/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted md:flex-row">
      <RestaurantSidebar restaurantName={restaurant.name} email={session.email} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
