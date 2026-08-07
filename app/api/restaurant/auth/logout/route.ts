import { NextResponse } from "next/server";

import { clearRestaurantSession } from "@/lib/restaurant/auth";

export async function POST() {
  clearRestaurantSession();
  return NextResponse.json({ success: true });
}
