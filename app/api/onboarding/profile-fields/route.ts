import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
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
  const { fields, company } = parsed.data;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, slug: true, company: true, cardPublished: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let slug = user.slug;
  let nextCompany = user.company;
  if (!user.cardPublished && typeof company === "string") {
    const trimmed = company.trim();
    nextCompany = trimmed;
    if (trimmed && trimmed !== (user.company ?? "")) {
      slug = await generateUniqueSlug(user.name ?? "", trimmed, userId);
    }
  }

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
    db.user.update({
      where: { id: userId },
      data: { company: nextCompany, slug },
    }),
  ]);

  const savedFields = await db.cardField.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ success: true, fields: savedFields, slug, company: nextCompany });
}
