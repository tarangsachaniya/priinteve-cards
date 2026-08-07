import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { generateInitialPassword } from "@/lib/restaurant/codes";
import { ownerPasswordResetSchema } from "@/lib/validations/restaurant";

/**
 * Resets the owner login for a restaurant. An empty body generates a new
 * random password; the plaintext is returned once and never stored.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const parsed = ownerPasswordResetSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const owner = await db.restaurantUser.findFirst({
    where: { restaurantId: params.id, role: "OWNER" },
    select: { id: true, email: true },
  });
  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const plainPassword = parsed.data.password || generateInitialPassword();
  await db.restaurantUser.update({
    where: { id: owner.id },
    data: { passwordHash: await bcrypt.hash(plainPassword, 10) },
  });

  await writeAuditLog({
    actorId: auth.session.user.id,
    actorEmail: auth.session.user.email!,
    action: "restaurant.password.reset",
    targetType: "restaurant",
    targetId: params.id,
    metadata: { ownerEmail: owner.email },
  });

  return NextResponse.json({ credentials: { email: owner.email, password: plainPassword } });
}
