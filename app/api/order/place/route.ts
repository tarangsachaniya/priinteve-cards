import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/restaurant/customer-auth";
import { resolveOpenState } from "@/lib/restaurant/hours";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { computeOrderTotals, resolveUnitPrice } from "@/lib/restaurant/pricing";
import { clientIp, rateLimit } from "@/lib/restaurant/rate-limit";
import { placeOrderSchema } from "@/lib/validations/restaurant";

export async function POST(req: Request) {
  const limited = rateLimit({ key: `place-order:${clientIp(req)}`, limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many orders from this device, try again shortly" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = placeOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your order details" },
      { status: 400 }
    );
  }

  const {
    restaurantSlug,
    tableCode,
    customerName,
    mobile,
    type,
    items,
    note,
    deliveryAddress,
    deliveryPincode,
    deliveryNotes,
    pickupInMinutes,
  } = parsed.data;

  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: { hours: true },
  });
  if (!restaurant || !restaurant.isActive) {
    return NextResponse.json({ error: "This restaurant isn't accepting orders" }, { status: 404 });
  }

  // The same resolver the menu used to draw its Open badge. Re-checked here
  // because the badge is a claim made when the page loaded and this is the
  // moment that actually matters — a guest can sit on an open menu until well
  // after closing time.
  const openState = resolveOpenState({
    hours: restaurant.hours,
    timezone: restaurant.timezone,
    isActive: restaurant.isActive,
    acceptingOrders: restaurant.acceptingOrders,
    closedMessage: restaurant.closedMessage,
  });
  if (!openState.isOpen) {
    return NextResponse.json({ error: openState.label }, { status: 409 });
  }

  // The restaurant's own configuration decides what's allowed — a crafted
  // request can't order a type the restaurant disabled.
  const typeEnabled =
    (type === "DINE_IN" && restaurant.dineInEnabled) ||
    (type === "TAKE_AWAY" && restaurant.takeAwayEnabled) ||
    (type === "DELIVERY" && restaurant.deliveryEnabled);
  if (!typeEnabled) {
    return NextResponse.json({ error: "That order type isn't available" }, { status: 400 });
  }

  let tableId: string | null = null;
  if (type === "DINE_IN") {
    const table = await db.restaurantTable.findFirst({
      where: { code: tableCode, restaurantId: restaurant.id, isActive: true },
      select: { id: true },
    });
    if (!table) {
      return NextResponse.json({ error: "That table isn't available" }, { status: 404 });
    }
    tableId = table.id;
  }

  // Prices come from the database, never from the request. The client sends
  // ids and quantities only — same rule as the card purchase flow.
  const menuItems = await db.menuItem.findMany({
    where: {
      id: { in: items.map((i) => i.menuItemId) },
      restaurantId: restaurant.id,
      isAvailable: true,
    },
    include: {
      variants: { where: { isAvailable: true } },
      addOns: { where: { isAvailable: true } },
    },
  });

  const byId = new Map(menuItems.map((item) => [item.id, item]));
  const missing = items.filter((line) => !byId.has(line.menuItemId));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Some items are no longer available — please review your cart" },
      { status: 409 }
    );
  }

  /**
   * Options are resolved and priced here, from the database.
   *
   * The client sends ids only. An id that no longer names an available option
   * is rejected rather than quietly dropped: silently serving a guest the
   * plain dish they did not order is worse than making them pick again.
   */
  const pricedLines: {
    menuItemId: string;
    name: string;
    basePrice: number;
    variantName: string | null;
    variantPriceDelta: number;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    note: string | null;
    addOns: { create: { name: string; price: number }[] };
  }[] = [];

  for (const line of items) {
    const menuItem = byId.get(line.menuItemId)!;

    const variant = line.variantId
      ? menuItem.variants.find((v) => v.id === line.variantId)
      : undefined;
    if (line.variantId && !variant) {
      return NextResponse.json(
        { error: `The size chosen for ${menuItem.name} is no longer available` },
        { status: 409 }
      );
    }

    const addOns = line.addOnIds.map((id) => menuItem.addOns.find((a) => a.id === id));
    if (addOns.some((addOn) => !addOn)) {
      return NextResponse.json(
        { error: `An extra chosen for ${menuItem.name} is no longer available` },
        { status: 409 }
      );
    }
    const resolvedAddOns = addOns as NonNullable<(typeof addOns)[number]>[];

    const unitPrice = resolveUnitPrice({
      basePrice: menuItem.price,
      variantPriceDelta: variant?.priceDelta ?? 0,
      addOnPrices: resolvedAddOns.map((addOn) => addOn.price),
    });

    pricedLines.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      basePrice: menuItem.price,
      variantName: variant?.name ?? null,
      variantPriceDelta: variant?.priceDelta ?? 0,
      unitPrice,
      quantity: line.quantity,
      lineTotal: unitPrice * line.quantity,
      note: line.note ?? null,
      addOns: {
        create: resolvedAddOns.map((addOn) => ({ name: addOn.name, price: addOn.price })),
      },
    });
  }

  const totals = computeOrderTotals({
    items: pricedLines,
    rules: { taxPercent: restaurant.taxPercent, deliveryFee: restaurant.deliveryFee },
    orderType: type,
  });

  if (totals.subtotal < restaurant.minOrderValue) {
    return NextResponse.json(
      { error: `Minimum order value is ₹${restaurant.minOrderValue}` },
      { status: 400 }
    );
  }

  // The body's name and mobile are now only ever an echo of the session the
  // menu established, so trust the cookie over them when it's there and
  // belongs to this restaurant — that's the copy the guest actually proved
  // they hold. The body stays the fallback rather than the session becoming
  // mandatory: a browser that blocks cookies still clears the sign-in prompt
  // in memory, and requiring a readable session here would make its orders
  // unplaceable.
  const session = await getCustomerSession();
  const identity =
    session && session.restaurantId === restaurant.id
      ? { name: session.name, mobile: session.mobile }
      : { name: customerName, mobile };

  const normalizedMobile = normalizeMobile(identity.mobile);
  if (!normalizedMobile) {
    return NextResponse.json({ error: "Enter a valid mobile number" }, { status: 400 });
  }

  const order = await db.$transaction(async (tx) => {
    const customer = await tx.restoCustomer.upsert({
      where: { restaurantId_mobile: { restaurantId: restaurant.id, mobile: normalizedMobile } },
      // A returning guest can correct the name we prefilled for them.
      update: { name: identity.name, orderCount: { increment: 1 }, lastOrderAt: new Date() },
      create: {
        restaurantId: restaurant.id,
        mobile: normalizedMobile,
        name: identity.name,
        orderCount: 1,
        lastOrderAt: new Date(),
      },
    });

    // Atomic per-restaurant counter, so two simultaneous orders can't take
    // the same display number.
    const counter = await tx.restaurant.update({
      where: { id: restaurant.id },
      data: { orderSeq: { increment: 1 } },
      select: { orderSeq: true },
    });

    return tx.restoOrder.create({
      data: {
        restaurantId: restaurant.id,
        orderNumber: counter.orderSeq,
        tableId,
        customerId: customer.id,
        customerName: identity.name,
        customerMobile: normalizedMobile,
        type,
        // Dine-in still pays after the meal, once staff close the bill. Take-away
        // and delivery have no "closing the bill" moment, so payment opens the
        // instant the order is placed — same REQUESTED state request-payment
        // already uses, just set at creation instead of by staff later.
        paymentStatus: type === "DINE_IN" ? "PENDING" : "REQUESTED",
        paymentRequestedAt: type === "DINE_IN" ? undefined : new Date(),
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        deliveryAddress: type === "DELIVERY" ? (deliveryAddress ?? null) : null,
        deliveryPincode: type === "DELIVERY" ? (deliveryPincode ?? null) : null,
        deliveryNotes: type === "DELIVERY" ? (deliveryNotes ?? null) : null,
        pickupInMinutes: type === "TAKE_AWAY" ? (pickupInMinutes ?? null) : null,
        note: note ?? null,
        items: { create: pricedLines },
      },
      include: { items: true },
    });
  });

  // Placing an order never touches the payment gateway now. The kitchen sees
  // the order immediately; the customer pays once the restaurant closes the
  // bill, from the status page.
  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    statusUrl: `/order/${restaurant.slug}/status/${order.id}`,
  });
}
