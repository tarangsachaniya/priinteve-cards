import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { uploadGalleryImageForUser } from "@/lib/services/gallery-service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Admin-managed edits are never limited by the target user's plan.
  const result = await uploadGalleryImageForUser(params.id, file, { bypassLimit: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}
