import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { addYoutubeItemForUser } from "@/lib/services/gallery-service";
import { saveYoutubeItemSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = saveYoutubeItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Admin-managed edits are never limited by the target user's plan.
  const result = await addYoutubeItemForUser(params.id, parsed.data.url, { bypassLimit: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}
