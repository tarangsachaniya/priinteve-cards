import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const viewSchema = z.object({ slug: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = viewSchema.safeParse(body);

  if (parsed.success) {
    const user = await db.user.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true, cardPublished: true },
    });

    if (user?.cardPublished) {
      await Promise.all([
        db.user.update({
          where: { id: user.id },
          data: { viewCount: { increment: 1 } },
        }),
        db.cardView.create({ data: { userId: user.id } }),
      ]);
    }
  }

  return new NextResponse(null, { status: 204 });
}
