import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveProfileFieldsSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveProfileFieldsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { fields } = parsed.data;

  await db.$transaction([
    db.cardField.deleteMany({ where: { userId } }),
    db.cardField.createMany({
      data: fields.map((field, index) => ({
        userId,
        fieldType: field.fieldType,
        label: field.label,
        value: field.value,
        order: index,
      })),
    }),
    db.user.updateMany({
      where: { id: userId, onboardingStep: { lt: 2 } },
      data: { onboardingStep: 2 },
    }),
  ]);

  const savedFields = await db.cardField.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ success: true, fields: savedFields });
}
