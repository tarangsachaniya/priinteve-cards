import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { setGalleryLayoutForUser } from "@/lib/services/gallery-service";
import { saveGalleryLayoutSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = saveGalleryLayoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cardSettings = await setGalleryLayoutForUser(params.id, parsed.data.galleryLayout);
  return NextResponse.json({ success: true, cardSettings });
}
