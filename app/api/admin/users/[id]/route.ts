import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { updateUserSchema } from "@/lib/validations/admin";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      role: true,
      planId: true,
      planExpiresAt: true,
      walletPoints: true,
      cardPublished: true,
      onboardingStep: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { email, ...rest } = parsed.data;
  if (email !== existing.email) {
    const emailTaken = await db.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: { email, ...rest },
  });

  await writeAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "user.update",
    targetType: "user",
    targetId: user.id,
    metadata: { email: user.email, changes: parsed.data },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      planId: user.planId,
      planExpiresAt: user.planExpiresAt,
      walletPoints: user.walletPoints,
      cardPublished: user.cardPublished,
      onboardingStep: user.onboardingStep,
    },
  });
}
