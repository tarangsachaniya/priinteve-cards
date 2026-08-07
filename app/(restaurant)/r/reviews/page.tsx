import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { db } from "@/lib/db";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import {
  REVIEW_DISPLAY_THRESHOLD,
  relativeDay,
  summariseReviews,
} from "@/lib/restaurant/reviews";
import { formatRating } from "@/lib/restaurant/menu-display";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewVisibilityToggle } from "@/components/restaurant/review-visibility-toggle";

export const dynamic = "force-dynamic";

export default async function RestaurantReviewsPage() {
  const session = await getRestaurantSession();
  if (!session) redirect("/r/login");

  // Every review, hidden ones included — this is the owner's own view, and the
  // point of hiding is that guests stop seeing it, not that the owner does.
  const all = await db.restoReview.findMany({
    where: { restaurantId: session.restaurantId },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true } } },
  });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { ratingValue: true, ratingCount: true },
  });

  const summary = summariseReviews({
    reviews: all.filter((review) => !review.isHidden),
    fallback: {
      ratingValue: restaurant?.ratingValue ?? null,
      ratingCount: restaurant?.ratingCount ?? null,
    },
  });

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={Star}
        title="Reviews"
        description="Guests are asked to rate their meal once their bill is paid."
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-6 p-5">
          <div>
            <p className="text-3xl font-bold tabular-nums">
              {summary.isPublished ? formatRating(summary.ratingValue) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.ratingCount} {summary.ratingCount === 1 ? "review" : "reviews"}
            </p>
          </div>
          <p
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              summary.isPublished
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-700"
            }`}
          >
            {summary.isPublished
              ? "Your rating is live on your menu."
              : `${summary.remaining} more review${summary.remaining === 1 ? "" : "s"} needed. Ratings appear on your menu once you reach ${REVIEW_DISPLAY_THRESHOLD}, so a handful of early ratings can't set your score.`}
          </p>
        </CardContent>
      </Card>

      {all.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Star className="size-8 text-muted-foreground" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Guests see the rating prompt on their order page as soon as you mark their bill paid.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {all.map((review) => (
            <li key={review.id}>
              <Card className={review.isHidden ? "opacity-60" : undefined}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-3.5 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </span>
                      <span className="text-sm font-medium">{review.customerName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Order #{review.order.orderNumber} · {relativeDay(review.createdAt.toISOString())}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  )}

                  <ReviewVisibilityToggle id={review.id} isHidden={review.isHidden} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
