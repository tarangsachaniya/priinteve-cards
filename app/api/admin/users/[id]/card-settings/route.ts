import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { adminCardSettingsSchema } from "@/lib/validations/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const cardSettings = await db.cardSettings.findUnique({ where: { userId: params.id } });
  return NextResponse.json({ cardSettings });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = adminCardSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cardSettings = await db.cardSettings.upsert({
    where: { userId: params.id },
    update: parsed.data,
    create: { userId: params.id, ...parsed.data },
  });

  await revalidateUserCard(params.id);
  return NextResponse.json({ success: true, cardSettings });
}
