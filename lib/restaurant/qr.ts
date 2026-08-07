/**
 * Customer-facing URLs for the restaurant module. QR image bytes come from
 * the existing generateQrPngBuffer() in lib/qr.ts.
 */

function baseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/** The URL printed on a table's QR code. */
export function getTableOrderUrl(restaurantSlug: string, tableCode: string): string {
  return `${baseUrl()}/order/${restaurantSlug}/${tableCode}`;
}

/** Table-less entry point, for take-away and delivery. */
export function getRestaurantOrderUrl(restaurantSlug: string): string {
  return `${baseUrl()}/order/${restaurantSlug}`;
}

export function getOrderStatusUrl(restaurantSlug: string, orderId: string): string {
  return `${baseUrl()}/order/${restaurantSlug}/status/${orderId}`;
}
