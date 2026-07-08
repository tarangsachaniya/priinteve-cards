import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { cardFieldUpdateSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const field = await db.cardField.findUnique({ where: { id: params.id } });
  if (!field || field.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data =
    field.fieldType === "bio"
      ? { ...parsed.data, value: sanitizeRichTextServer(parsed.data.value) }
      : parsed.data;

  const updated = await db.cardField.update({
    where: { id: params.id },
    data,
  });

  await revalidateUserCard(session.user.id);

  return NextResponse.json({ success: true, field: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const field = await db.cardField.findUnique({ where: { id: params.id } });
  if (!field || field.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.cardField.delete({ where: { id: params.id } });

  await revalidateUserCard(session.user.id);

  return NextResponse.json({ success: true });
}
