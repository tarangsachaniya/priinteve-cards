import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { generateQrPngBuffer, getCardUrl } from "@/lib/qr";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  // Deliberately not gated on cardPublished: every user gets a working QR as
  // soon as they have a slug, so it can be shown during setup, before they've
  // purchased a plan (the print-ready PDF flyer stays gated — see pdf/route.ts).
  const user = await db.user.findUnique({
    where: { slug: params.slug },
    select: { slug: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await generateQrPngBuffer(getCardUrl(user.slug));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
