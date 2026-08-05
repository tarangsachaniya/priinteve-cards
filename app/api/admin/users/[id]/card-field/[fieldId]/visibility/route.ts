import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { setCardFieldVisibilityForUser } from "@/lib/services/card-field-service";
import { cardFieldVisibilitySchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string; fieldId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = cardFieldVisibilitySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await setCardFieldVisibilityForUser(params.id, params.fieldId, parsed.data.isVisible);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, field: result.data });
}
