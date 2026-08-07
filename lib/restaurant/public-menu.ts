import type { RestoOrderType, RestoPaymentMode } from "@prisma/client";

import { db } from "@/lib/db";
import { resolveOpenState } from "@/lib/restaurant/hours";
import { isRazorpayConfigured } from "@/lib/restaurant/payment";
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
} | null> {
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      hours: { orderBy: { dayOfWeek: "asc" } },
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

  // Online is offered only when the restaurant enabled it AND the deployment
  // actually has Razorpay keys — never show a button that can't work.
  const paymentModes: RestoPaymentMode[] = [
    ...(restaurant.onlinePaymentEnabled && isRazorpayConfigured() ? (["ONLINE"] as const) : []),
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

  // Below the threshold this returns the owner-entered rating untouched; above
  // it, the measured one replaces it entirely.
  const reviewSummary = summariseReviews({
    reviews: restaurant.reviews,
    fallback: { ratingValue: restaurant.ratingValue, ratingCount: restaurant.ratingCount },
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
      hours: restaurant.hours.map(({ dayOfWeek, opensAt, closesAt, isClosed }) => ({
        dayOfWeek,
        opensAt,
        closesAt,
        isClosed,
      })),
      timezone: restaurant.timezone,
      reviewSummary,
    },
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
