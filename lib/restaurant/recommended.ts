import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";

/**
 * What guests are actually ordering, right now.
 *
 * The owner's `badge` field already says what they think is popular. This says
 * what the last hour says, which is a different and often more useful fact —
 * it catches the weather, the match on TV, and the dish the table by the window
 * just recommended to their friends.
 */

/** How far back "right now" reaches. */
const WINDOW_MINUTES = 60;

/**
 * How long a computed strip is reused.
 *
 * A rolling hour recomputed every five minutes, rather than a bucket rebuilt on
 * the hour. Both were on the table; this one wins because a dish that starts
 * selling at 10:05 should surface while the rush is still on, not at 11:00 when
 * it is over. The cost is one grouped query per restaurant per five minutes.
 */
const CACHE_SECONDS = 300;

/** More than this and the strip stops being a shortcut and becomes a second menu. */
const MAX_ITEMS = 8;

/** Falls back over a week, which is long enough that a quiet 3pm still has data. */
const FALLBACK_DAYS = 7;

async function topSellingSince(restaurantId: string, since: Date): Promise<string[]> {
  const rows = await db.restoOrderItem.groupBy({
    by: ["menuItemId"],
    where: {
      // Cancelled orders are excluded: food nobody ate is not a recommendation.
      order: { restaurantId, placedAt: { gte: since }, status: { not: "CANCELLED" } },
      menuItemId: { not: null },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: MAX_ITEMS,
  });

  // Grouped by menuItemId rather than the snapshot `name` the history report
  // uses: that report is about what was sold and must survive a deleted dish,
  // whereas this one has to render live, orderable cards and therefore needs
  // ids that still resolve. Rows whose dish is gone drop out here.
  return rows
    .map((row) => row.menuItemId)
    .filter((id): id is string => id !== null);
}

/**
 * The dish ids to feature, most-ordered first.
 *
 * Cached per restaurant. `unstable_cache` keys on the arguments, so one
 * restaurant's quiet hour never suppresses another's strip.
 */
export const getRecommendedItemIds = unstable_cache(
  async (restaurantId: string): Promise<string[]> => {
    const now = Date.now();

    const recent = await topSellingSince(
      restaurantId,
      new Date(now - WINDOW_MINUTES * 60_000)
    );
    if (recent.length > 0) return recent;

    // Nothing in the last hour. A 3pm Tuesday is quiet, not broken — falling
    // back to the week keeps the strip meaningful instead of making the menu
    // visibly change shape between busy and slow hours.
    return topSellingSince(restaurantId, new Date(now - FALLBACK_DAYS * 24 * 60 * 60_000));
  },
  ["resto-recommended"],
  { revalidate: CACHE_SECONDS }
);
