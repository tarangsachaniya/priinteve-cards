import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { addYoutubeItemForUser } from "@/lib/services/gallery-service";
import { saveYoutubeItemSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveYoutubeItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await addYoutubeItemForUser(session.user.id, parsed.data.url, {
    bypassLimit: session.user.role === "ADMIN",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}
