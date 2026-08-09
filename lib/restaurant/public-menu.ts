import type { RestoOrderType, RestoPaymentMode } from "@prisma/client";

import { db } from "@/lib/db";
import { resolveOpenState } from "@/lib/restaurant/hours";
import { isRazorpayConfigured } from "@/lib/restaurant/payment";
import { resolvePeakState } from "@/lib/restaurant/peak-hours";
import { getRecommendedItemIds } from "@/lib/restaurant/recommended";
import { summariseReviews } from "@/lib/restaurant/reviews";
import type { PublicMenuCategory, PublicRestaurant } from "@/components/order/types";

/**
 * Loads everything the customer-facing menu needs for one restaurant.
 * Shared by the table entry, the table-less entry and the status page so the
 * three can never disagree about what's enabled.
 */
export async function loadPublicMenu(slug: string): Promise<{
  restaurant: PublicRestaurant;
  categories: PublicMenuCategory[];
  /** Dish ids to feature, most-ordered first. Empty when there's nothing to say. */
  recommendedItemIds: string[];
} | null> {
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      hours: { orderBy: { dayOfWeek: "asc" } },
      peakWindows: { orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }] },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        select: { id: true, customerName: true, rating: true, comment: true, createdAt: true },
      },
      categories: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          items: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              // Unavailable options are filtered out here rather than dimmed in
              // the UI: an option a guest cannot pick is noise, unlike a whole
              // dish, whose absence would confuse a returning customer.
              variants: {
                where: { isAvailable: true },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
              addOns: {
                where: { isAvailable: true },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant || !restaurant.isActive) return null;

  const orderTypes: RestoOrderType[] = [
    ...(restaurant.dineInEnabled ? (["DINE_IN"] as const) : []),
    ...(restaurant.takeAwayEnabled ? (["TAKE_AWAY"] as const) : []),
    ...(restaurant.deliveryEnabled ? (["DELIVERY"] as const) : []),
  ];

  // Each mode is gated on being able to actually work, not just on being
  // switched on — never show a button that would fail. Online needs Razorpay
  // keys on the deployment; UPI QR needs a VPA to encode into the code.
  const paymentModes: RestoPaymentMode[] = [
    ...(restaurant.onlinePaymentEnabled && isRazorpayConfigured() ? (["ONLINE"] as const) : []),
    ...(restaurant.upiQrEnabled && restaurant.upiVpa ? (["UPI_QR"] as const) : []),
    ...(restaurant.counterPaymentEnabled ? (["COUNTER"] as const) : []),
  ];

  // Resolved here rather than in the component so the badge a guest sees and
  // the check the place-order route makes come from one call.
  const openState = resolveOpenState({
    hours: restaurant.hours,
    timezone: restaurant.timezone,
    isActive: restaurant.isActive,
    acceptingOrders: restaurant.acceptingOrders,
    closedMessage: restaurant.closedMessage,
  });

  // Resolved here for the same reason openState is: the order the guest's menu
  // renders in and the state the owner's preview claims must come from one
  // call, or the two screens disagree about whether the rush is on.
  const peakState = resolvePeakState({
    windows: restaurant.peakWindows,
    timezone: restaurant.timezone,
  });

  // Below the threshold this returns the owner-entered rating untouched; above
  // it, the measured one replaces it entirely.
  const reviewSummary = summariseReviews({
    reviews: restaurant.reviews,
    fallback: { ratingValue: restaurant.ratingValue, ratingCount: restaurant.ratingCount },
  });

  const availableItemIds = new Set(
    restaurant.categories.flatMap((category) => category.items.map((item) => item.id))
  );
  const demotedItemIds = new Set(
    restaurant.categories.flatMap((category) =>
      category.items.filter((item) => item.demoteAtPeak).map((item) => item.id)
    )
  );

  // Cached for five minutes — see lib/restaurant/recommended.ts.
  const recommended = await getRecommendedItemIds(restaurant.id);

  const recommendedItemIds = recommended.filter((id) => {
    // A dish that has since been hidden, sold out or moved to an inactive
    // category isn't on the menu, so featuring it would offer a card the
    // guest can't add.
    if (!availableItemIds.has(id)) return false;
    // During a rush, a demoted dish must not be promoted back to the top by
    // the very demand the demotion exists to dampen.
    if (!peakState.isPeak) return true;
    return !demotedItemIds.has(id);
  });

  return {
    restaurant: {
      name: restaurant.name,
      branch: restaurant.branch,
      slug: restaurant.slug,
      address: restaurant.address,
      phone: restaurant.phone,
      brandColor: restaurant.brandColor,
      themeMode: restaurant.themeMode,
      logoUrl: restaurant.logoUrl,
      coverImageUrl: restaurant.coverImageUrl,
      tagline: restaurant.tagline,
      description: restaurant.description,
      cuisineTags: restaurant.cuisineTags,
      prepTimeMinMins: restaurant.prepTimeMinMins,
      prepTimeMaxMins: restaurant.prepTimeMaxMins,
      costForTwo: restaurant.costForTwo,
      // Once ten real reviews exist these are the measured values, not the
      // owner's claim — see summariseReviews().
      ratingValue: reviewSummary.ratingValue,
      ratingCount: reviewSummary.ratingCount,
      taxPercent: restaurant.taxPercent,
      deliveryFee: restaurant.deliveryFee,
      minOrderValue: restaurant.minOrderValue,
      orderTypes,
      paymentModes,
      openState,
      peakState,
      hours: restaurant.hours.map(({ dayOfWeek, opensAt, closesAt, isClosed }) => ({
        dayOfWeek,
        opensAt,
        closesAt,
        isClosed,
      })),
      timezone: restaurant.timezone,
      reviewSummary,
    },
    recommendedItemIds,
    // Categories with nothing in them would render as empty headings.
    categories: restaurant.categories
      .filter((category) => category.items.length > 0)
      .map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        items: category.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
          badge: item.badge,
          ratingValue: item.ratingValue,
          prepMinutes: item.prepMinutes,
          demoteAtPeak: item.demoteAtPeak,
          variants: item.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            priceDelta: variant.priceDelta,
            isDefault: variant.isDefault,
          })),
          addOns: item.addOns.map((addOn) => ({
            id: addOn.id,
            name: addOn.name,
            price: addOn.price,
          })),
        })),
      })),
  };
}
