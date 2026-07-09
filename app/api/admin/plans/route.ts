import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { enforceDraftInvariant } from "@/lib/plan-status";
import { planCreateRequestSchema } from "@/lib/validations/admin";

const SORTABLE_FIELDS = new Set(["name", "price", "validityDays", "createdAt", "updatedAt"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const search = searchParams.get("search")?.trim() ?? "";
  const sortByParam = searchParams.get("sortBy") ?? "createdAt";
  const sortBy = SORTABLE_FIELDS.has(sortByParam) ? sortByParam : "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const status = searchParams.get("status");
  const cardType = searchParams.get("cardType");

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(cardType && cardType !== "all" && { cardType: cardType as "NFC" | "QR" | "BOTH" }),
    ...(status === "active" && { isDraft: false, isActive: true }),
    ...(status === "disabled" && { isDraft: false, isActive: false }),
    ...(status === "draft" && { isDraft: true }),
  };

  const [total, plans, statTotal, statActive, statDisabled, statDraft, statSubscribers] =
    await Promise.all([
      db.plan.count({ where }),
      db.plan.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { users: true, purchases: true } } },
      }),
      db.plan.count(),
      db.plan.count({ where: { isDraft: false, isActive: true } }),
      db.plan.count({ where: { isDraft: false, isActive: false } }),
      db.plan.count({ where: { isDraft: true } }),
      db.user.count({ where: { NOT: { planId: null } } }),
    ]);

  return NextResponse.json({
    plans: plans.map((p) => ({
      ...p,
      subscriberCount: p._count.users,
      purchaseCount: p._count.purchases,
    })),
    total,
    page,
    limit,
    stats: {
      total: statTotal,
      active: statActive,
      disabled: statDisabled,
      draft: statDraft,
      totalSubscribers: statSubscribers,
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = planCreateRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { duplicateOf, ...data } = parsed.data;
  const plan = await db.plan.create({ data: enforceDraftInvariant(data) });

  await writeAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: duplicateOf ? "plan.duplicate" : "plan.create",
    targetType: "plan",
    targetId: plan.id,
    metadata: { name: plan.name, duplicateOf },
  });

  return NextResponse.json({ plan });
}
