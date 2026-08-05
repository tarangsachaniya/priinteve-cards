import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { createCardFieldForUser } from "@/lib/services/card-field-service";
import { cardFieldInputSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = cardFieldInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Admin-managed edits are never limited by the target user's plan.
  const result = await createCardFieldForUser(params.id, parsed.data, { bypassLimit: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "card-field.create", fieldType: parsed.data.fieldType },
  });

  return NextResponse.json({ success: true, field: result.data });
}
