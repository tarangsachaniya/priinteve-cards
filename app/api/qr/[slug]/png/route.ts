import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { generateQrPngBuffer, getCardUrl } from "@/lib/qr";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const user = await db.user.findUnique({
    where: { slug: params.slug },
    select: { slug: true, cardPublished: true },
  });

  if (!user || !user.cardPublished) {
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
