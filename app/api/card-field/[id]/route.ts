import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { cardFieldUpdateSchema } from "@/lib/validations/onboarding";
import { STRUCTURED_FIELD_TYPES, parseAndValidateStructuredValue } from "@/lib/validations/card-field";

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

  let value: string;
  try {
    if (field.fieldType === "bio") {
      value = sanitizeRichTextServer(parsed.data.value);
    } else if (field.fieldType === "custom_html") {
      value = sanitizeRichTextServer(parsed.data.value, { allowCustomHtmlTags: true });
    } else if (STRUCTURED_FIELD_TYPES.has(field.fieldType)) {
      value = parseAndValidateStructuredValue(field.fieldType, parsed.data.value);
    } else {
      value = parsed.data.value;
    }
  } catch {
    return NextResponse.json({ error: "Invalid value for field type" }, { status: 400 });
  }

  const updated = await db.cardField.update({
    where: { id: params.id },
    data: { label: parsed.data.label, value },
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
