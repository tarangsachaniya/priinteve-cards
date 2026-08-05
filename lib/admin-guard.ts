import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireAdminSession(): Promise<
  { ok: true; session: Session } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, session };
}
