import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { enforceDraftInvariant } from "@/lib/plan-status";
import { planUpdateSchema } from "@/lib/validations/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = planUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.plan.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const data = enforceDraftInvariant(parsed.data);
  const plan = await db.plan.update({ where: { id: params.id }, data });

  const changedKeys = Object.keys(data);
  const isPureActiveToggle = changedKeys.length === 1 && changedKeys[0] === "isActive";

  await writeAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: isPureActiveToggle ? (data.isActive ? "plan.enable" : "plan.disable") : "plan.update",
    targetType: "plan",
    targetId: plan.id,
    metadata: { name: plan.name, changes: data },
  });

  return NextResponse.json({ plan });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const hard = searchParams.get("mode") === "hard";

  if (!hard) {
    const plan = await db.plan.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await writeAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email!,
      action: "plan.disable",
      targetType: "plan",
      targetId: plan.id,
      metadata: { name: plan.name },
    });

    return NextResponse.json({ plan });
  }

  const existing = await db.plan.findUnique({
    where: { id: params.id },
    include: { _count: { select: { users: true, purchases: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (existing._count.users > 0 || existing._count.purchases > 0) {
    return NextResponse.json(
      {
        error:
          "This plan has subscribers or purchase history and cannot be permanently deleted. Disable it instead.",
      },
      { status: 409 }
    );
  }

  try {
    await db.plan.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json(
      { error: "This plan is still referenced elsewhere and cannot be deleted." },
      { status: 409 }
    );
  }

  await writeAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "plan.delete",
    targetType: "plan",
    targetId: null,
    metadata: { name: existing.name },
  });

  return NextResponse.json({ success: true });
}
