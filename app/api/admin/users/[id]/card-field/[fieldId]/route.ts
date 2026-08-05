import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { deleteCardFieldForUser, updateCardFieldForUser } from "@/lib/services/card-field-service";
import { cardFieldUpdateSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string; fieldId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = cardFieldUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateCardFieldForUser(params.id, params.fieldId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "card-field.update", fieldId: params.fieldId },
  });

  return NextResponse.json({ success: true, field: result.data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; fieldId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const result = await deleteCardFieldForUser(params.id, params.fieldId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "card-field.delete", fieldId: params.fieldId },
  });

  return NextResponse.json({ success: true });
}
