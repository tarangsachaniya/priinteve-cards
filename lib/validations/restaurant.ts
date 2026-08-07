import { z } from "zod";

import { INDIAN_MOBILE_REGEX, extractNationalDigits } from "@/lib/restaurant/mobile";
import { RESTO_MODE_IDS } from "@/lib/restaurant/theme";

/**
 * Every zod schema for the restaurant ordering module, following the
 * lib/validations/* convention used by the card product.
 */

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color like #16A34A");

/**
 * A cleared number input posts "", which coerces to 0 — and 0 is a meaningful
 * value for most of these fields. Everything optional therefore routes through
 * here so "cleared" stays distinguishable from "zero".
 */
const emptyToNull = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : value;

function optionalInt(max: number) {
  return z.preprocess(emptyToNull, z.coerce.number().int().min(0).max(max).nullable()).optional();
}

/**
 * Owners type a rating the way they'd read it ("4.7"); storage is ×10 — see
 * Restaurant.ratingValue for why the schema avoids floats.
 */
const optionalDisplayRating = z
  .preprocess(emptyToNull, z.coerce.number().min(1, "Ratings run from 1.0 to 5.0").max(5, "Ratings run from 1.0 to 5.0").nullable())
  .optional()
  .transform((value) => (value === null || value === undefined ? null : Math.round(value * 10)));

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable()).optional();

/** Accepts any of "9876543210", "+91 98765 43210", "09876543210". */
export const mobileSchema = z
  .string()
  .trim()
  .refine((value) => INDIAN_MOBILE_REGEX.test(extractNationalDigits(value)), {
    message: "Enter a valid 10-digit Indian mobile number",
  });

// ─── Admin: restaurants ────────────────────────────────────────────────────

export const restaurantCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  // Required: two outlets of the same brand are the normal case this module
  // is built for, and the branch is what keeps their slugs, QR codes and
  // owner logins from colliding. A single-outlet business types its area or
  // "Main" — there is no reading of "restaurant" here that has no location.
  branch: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
    .min(2)
    .max(60)
    .optional(),
  ownerName: z.string().trim().min(2).max(80),
  ownerEmail: z.string().trim().toLowerCase().email(),
  // Required: the admin sets the owner's first password directly rather than
  // a generated one being the only path, so it can be something the admin
  // reads out over a phone call without a typo risk.
  ownerPassword: z.string().min(8).max(72),
  phone: mobileSchema.optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  /**
   * How many tables to generate with the restaurant, labelled "Table 1"…"N".
   * Zero is legitimate — a takeaway-only kitchen has no tables — so this is a
   * plain default rather than a required field.
   */
  tableCount: z.preprocess(
    emptyToNull,
    z.coerce.number().int().min(0).max(200).nullable()
  ).optional().transform((value) => value ?? 0),
});

export const restaurantUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  branch: z.string().trim().max(60).optional().or(z.literal("")),
  phone: mobileSchema.optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const ownerPasswordResetSchema = z.object({
  password: z.string().min(8).max(72),
});

// ─── Restaurant: auth ──────────────────────────────────────────────────────

export const restaurantLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// ─── Restaurant: settings ──────────────────────────────────────────────────

export const restaurantSettingsSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    branch: z.string().trim().max(60).optional().or(z.literal("")),
    phone: mobileSchema.optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    brandColor: hexColor,
    dineInEnabled: z.boolean(),
    takeAwayEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    onlinePaymentEnabled: z.boolean(),
    counterPaymentEnabled: z.boolean(),
    taxPercent: z.coerce.number().int().min(0).max(50),
    deliveryFee: z.coerce.number().int().min(0).max(10000),
    minOrderValue: z.coerce.number().int().min(0).max(100000),

    // Presentation — how the restaurant appears above its menu.
    coverImageUrl: optionalText(500),
    coverPublicId: optionalText(200),
    tagline: optionalText(120),
    description: optionalText(400),
    cuisineTags: z.array(z.string().trim().min(1).max(24)).max(6).default([]),
    prepTimeMinMins: optionalInt(240),
    prepTimeMaxMins: optionalInt(240),
    costForTwo: optionalInt(100000),
    ratingValue: optionalDisplayRating,
    ratingCount: optionalInt(10000000),
    themeMode: z.enum(RESTO_MODE_IDS),
  })
  .refine((v) => v.dineInEnabled || v.takeAwayEnabled || v.deliveryEnabled, {
    message: "Enable at least one order type, or customers can't order at all",
    path: ["dineInEnabled"],
  })
  .refine((v) => v.onlinePaymentEnabled || v.counterPaymentEnabled, {
    message: "Enable at least one payment mode",
    path: ["onlinePaymentEnabled"],
  })
  .refine(
    (v) => v.prepTimeMinMins == null || v.prepTimeMaxMins == null || v.prepTimeMinMins <= v.prepTimeMaxMins,
    { message: "The shortest prep time can't be longer than the longest", path: ["prepTimeMinMins"] }
  )
  // A rating with no review count reads as invented, and a count with no
  // rating has nothing to qualify. Both or neither.
  .refine((v) => (v.ratingValue == null) === (v.ratingCount == null), {
    message: "Give both a rating and how many reviews it's based on, or leave both blank",
    path: ["ratingValue"],
  });

// ─── Restaurant: menu ──────────────────────────────────────────────────────

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(200).optional().or(z.literal("")),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const menuItemCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  price: z.coerce.number().int().min(0).max(1000000),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imagePublicId: z.string().optional().or(z.literal("")),
  badge: z.preprocess(emptyToNull, z.enum(["BESTSELLER", "CHEFS_PICK", "POPULAR", "NEW"]).nullable()).optional(),
  ratingValue: optionalDisplayRating,
});

export const menuItemUpdateSchema = menuItemCreateSchema.partial().extend({
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
});

// ─── Restaurant: item options ──────────────────────────────────────────────

/**
 * A variant adjusts the dish price rather than replacing it, so the delta may
 * be negative — a "Half plate" is priced below the base.
 */
export const variantCreateSchema = z.object({
  name: z.string().trim().min(1).max(40),
  priceDelta: z.coerce.number().int().min(-100000).max(100000).default(0),
  isDefault: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

export const variantUpdateSchema = variantCreateSchema.partial().extend({
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const addOnCreateSchema = z.object({
  name: z.string().trim().min(1).max(40),
  price: z.coerce.number().int().min(0).max(100000).default(0),
  isAvailable: z.boolean().default(true),
});

export const addOnUpdateSchema = addOnCreateSchema.partial().extend({
  sortOrder: z.coerce.number().int().min(0).optional(),
});

// ─── Restaurant: tables ────────────────────────────────────────────────────

export const tableCreateSchema = z.object({
  label: z.string().trim().min(1).max(40),
  seats: z.coerce.number().int().min(1).max(50).optional(),
});

export const tableUpdateSchema = tableCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const tableBulkCreateSchema = z.object({
  prefix: z.string().trim().min(1).max(20).default("Table"),
  count: z.coerce.number().int().min(1).max(50),
  startAt: z.coerce.number().int().min(1).max(500).default(1),
  seats: z.coerce.number().int().min(1).max(50).optional(),
});

// ─── Restaurant: orders ────────────────────────────────────────────────────

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
  cancelReason: z.string().trim().max(200).optional(),
});

// ─── Customer: ordering ────────────────────────────────────────────────────

export const customerLookupSchema = z.object({
  restaurantSlug: z.string().trim().min(1).max(60),
  mobile: mobileSchema,
});

export const placeOrderSchema = z
  .object({
    restaurantSlug: z.string().trim().min(1).max(60),
    tableCode: z.string().trim().min(1).max(40).optional(),
    customerName: z.string().trim().min(2).max(60),
    mobile: mobileSchema,
    type: z.enum(["DINE_IN", "TAKE_AWAY", "DELIVERY"]),
    // No paymentMode: the customer picks cash or UPI on the payment screen,
    // after the restaurant closes the bill. See settleOrderSchema below.
    // Only ids and quantities: prices are always read from the database. The
    // option ids are no exception — they name a choice, they don't price it.
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(50),
          note: z.string().trim().max(120).optional(),
          variantId: z.string().min(1).optional(),
          addOnIds: z.array(z.string().min(1)).max(20).default([]),
        })
      )
      .min(1)
      .max(50),
    note: z.string().trim().max(300).optional(),
    deliveryAddress: z.string().trim().max(300).optional(),
    deliveryPincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
      .optional(),
    deliveryNotes: z.string().trim().max(200).optional(),
    pickupInMinutes: z.coerce.number().int().min(0).max(180).optional(),
  })
  .refine((v) => v.type !== "DELIVERY" || (v.deliveryAddress && v.deliveryPincode), {
    message: "Delivery orders need an address and pincode",
    path: ["deliveryAddress"],
  })
  .refine((v) => v.type !== "DINE_IN" || !!v.tableCode, {
    message: "Dine-in orders must be placed from a table",
    path: ["tableCode"],
  });

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * What the customer chooses on the payment screen, once the restaurant has
 * closed the bill. UPI routes through Razorpay Checkout (which offers UPI as
 * a method); CASH declares an intention to pay at the counter and waits for
 * the restaurant to confirm receipt.
 */
export const settleOrderSchema = z.object({
  method: z.enum(["UPI", "CASH"]),
});

// ─── Restaurant: opening hours ─────────────────────────────────────────────

export const hoursDaySchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    // Minutes from midnight. 1439 is 23:59; a shift that ends at midnight is
    // expressed as 0, which the resolver reads as running past midnight.
    opensAt: z.coerce.number().int().min(0).max(1439),
    closesAt: z.coerce.number().int().min(0).max(1439),
    isClosed: z.coerce.boolean().default(false),
  })
  .refine((v) => v.isClosed || v.opensAt !== v.closesAt || v.opensAt === 0, {
    message: "Opening and closing time can't be the same",
    path: ["closesAt"],
  });

export const hoursUpdateSchema = z.object({
  timezone: z.string().trim().min(1).max(64).optional(),
  acceptingOrders: z.boolean().optional(),
  closedMessage: optionalText(120),
  // All seven days at once. A partial update would let a restaurant end up
  // with Tuesday missing, which the resolver reads as closed all day.
  days: z.array(hoursDaySchema).length(7).optional(),
});

// ─── Customer: reviews ─────────────────────────────────────────────────────

export const reviewCreateSchema = z.object({
  orderId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export type RestaurantCreateInput = z.infer<typeof restaurantCreateSchema>;
export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;
export type MenuItemCreateInput = z.infer<typeof menuItemCreateSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type HoursUpdateInput = z.infer<typeof hoursUpdateSchema>;
