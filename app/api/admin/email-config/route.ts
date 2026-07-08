import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailConfigSchema } from "@/lib/validations/admin";

const SECTION = "email_config";
const KEY = "expiryReminders";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = emailConfigSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const value = JSON.stringify(parsed.data.expiryReminders);

  await db.siteContent.upsert({
    where: { section_key: { section: SECTION, key: KEY } },
    update: { value },
    create: { section: SECTION, key: KEY, value },
  });

  return NextResponse.json({ success: true });
}
