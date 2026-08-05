import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createCardFieldForUser } from "@/lib/services/card-field-service";
import { cardFieldInputSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createCardFieldForUser(session.user.id, parsed.data, {
    bypassLimit: session.user.role === "ADMIN",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, field: result.data });
}
