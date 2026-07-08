import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteContentSchema } from "@/lib/validations/admin";

export async function PATCH(req: Request, { params }: { params: { section: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = siteContentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const section = params.section;

  await Promise.all(
    Object.entries(parsed.data).map(([key, value]) =>
      db.siteContent.upsert({
        where: { section_key: { section, key } },
        update: { value },
        create: { section, key, value },
      })
    )
  );

  return NextResponse.json({ success: true });
}
