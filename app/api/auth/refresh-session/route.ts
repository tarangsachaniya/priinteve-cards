import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions, issueSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * NextAuth's JWT session caches `cardPublished` at sign-in time and never
 * refreshes it on its own. After a purchase flips that flag in the DB, the
 * browser's existing session cookie is stale until the user logs out and
 * back in. This re-mints the session cookie with fresh DB values so pages
 * like /dashboard (which trust the session, not a DB read) work immediately.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await issueSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cardPublished: user.cardPublished,
  });

  return NextResponse.json({ success: true });
}
