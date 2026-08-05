import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { deleteGalleryItemForUser, updateGalleryItemForUser } from "@/lib/services/gallery-service";
import { galleryItemUpdateSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = galleryItemUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateGalleryItemForUser(params.id, params.itemId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const result = await deleteGalleryItemForUser(params.id, params.itemId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "gallery.delete", itemId: params.itemId },
  });

  return NextResponse.json({ success: true });
}
