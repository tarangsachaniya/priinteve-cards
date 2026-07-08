import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { cardFieldVisibilitySchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldVisibilitySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const field = await db.cardField.findUnique({ where: { id: params.id } });
  if (!field || field.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.cardField.update({
    where: { id: params.id },
    data: { isVisible: parsed.data.isVisible },
  });

  await revalidateUserCard(session.user.id);

  return NextResponse.json({ success: true, field: updated });
}
