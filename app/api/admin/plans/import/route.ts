import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { enforceDraftInvariant } from "@/lib/plan-status";
import { planCreateRequestSchema } from "@/lib/validations/admin";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const rows: unknown[] = Array.isArray(body?.rows) ? body.rows : [];

  const errors: { row: number; error: string }[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parsed = planCreateRequestSchema.safeParse(row);
    if (!parsed.success) {
      errors.push({ row: i, error: parsed.error.issues.map((e) => e.message).join(", ") });
      continue;
    }

    const { duplicateOf, ...data } = parsed.data;
    void duplicateOf;
    try {
      await db.plan.create({ data: enforceDraftInvariant(data) });
      created += 1;
    } catch {
      errors.push({ row: i, error: "Database error creating plan" });
    }
  }

  await writeAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "plan.import",
    targetType: "plan",
    targetId: null,
    metadata: { totalRows: rows.length, created, failed: errors.length, errors },
  });

  return NextResponse.json({ created, failed: errors.length, errors });
}
