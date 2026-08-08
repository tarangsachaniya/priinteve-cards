import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { isRazorpayConfigured } from "@/lib/restaurant/payment";
import { REVIEW_DISPLAY_THRESHOLD } from "@/lib/restaurant/reviews";
import { restaurantSettingsSchema } from "@/lib/validations/restaurant";

export async function PATCH(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = restaurantSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    // The client validates with this same schema before ever sending a
    // request, so landing here means the two have drifted — worth naming the
    // field, not just the bare message, since that mismatch is exactly what
    // costs time to track down otherwise.
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".");
    return NextResponse.json(
      { error: field ? `${field}: ${issue.message}` : issue?.message },
      { status: 400 }
    );
  }

  const { name, branch, phone, email, address, ratingValue, ratingCount, ...rest } = parsed.data;

  /**
   * The owner-entered rating is a placeholder for a restaurant with no reviews
   * yet. Once enough real ones exist, summariseReviews() stops showing it at
   * all — so it stops being editable at the same moment, and by the same count
   * (non-hidden reviews), or the lock and the display would disagree about
   * when the switch happened.
   *
   * Ignored rather than rejected: the settings form PATCHes every field at
   * once, so a 400 here would block an owner from changing their phone number
   * because a stale rating rode along in the payload. The pair is dropped
   * together, keeping the schema's "both null or both set" invariant intact.
   */
  const publishedReviews = await db.restoReview.count({
    where: { restaurantId: auth.session.restaurantId, isHidden: false },
  });
  const ratingLocked = publishedReviews >= REVIEW_DISPLAY_THRESHOLD;

  // Turning on online payment without keys would show customers a Pay Online
  // button that can't work, so refuse it here rather than at checkout.
  if (rest.onlinePaymentEnabled && !isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payment isn't configured on this deployment yet" },
      { status: 400 }
    );
  }

  const restaurant = await db.restaurant.update({
    where: { id: auth.session.restaurantId },
    data: {
      name,
      branch: branch || null,
      phone: phone ? normalizeMobile(phone) : null,
      email: email || null,
      address: address || null,
      // Stored ×10 (see Restaurant.ratingValue) — the schema validates the
      // decimal an owner actually typed, so the scaling happens exactly once,
      // right here, rather than inside the schema where it would double up
      // on the second (server-side) parse of an already-scaled value.
      ...(ratingLocked
        ? {}
        : {
            ratingValue: ratingValue == null ? null : Math.round(ratingValue * 10),
            ratingCount,
          }),
      ...rest,
    },
  });

  return NextResponse.json({ restaurant });
}
