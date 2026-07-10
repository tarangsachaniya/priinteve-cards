import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { cardFieldInputSchema } from "@/lib/validations/onboarding";
import { STRUCTURED_FIELD_TYPES, parseAndValidateStructuredValue } from "@/lib/validations/card-field";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { fieldType, label } = parsed.data;

  let value: string;
  try {
    if (fieldType === "bio") {
      value = sanitizeRichTextServer(parsed.data.value);
    } else if (fieldType === "custom_html") {
      value = sanitizeRichTextServer(parsed.data.value, { allowCustomHtmlTags: true });
    } else if (STRUCTURED_FIELD_TYPES.has(fieldType)) {
      value = parseAndValidateStructuredValue(fieldType, parsed.data.value);
    } else {
      value = parsed.data.value;
    }
  } catch {
    return NextResponse.json({ error: "Invalid value for field type" }, { status: 400 });
  }

  const last = await db.cardField.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const field = await db.cardField.create({
    data: { userId, fieldType, label, value, order: (last?.order ?? -1) + 1 },
  });

  await revalidateUserCard(userId);

  return NextResponse.json({ success: true, field });
}
