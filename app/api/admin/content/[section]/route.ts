import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { LIST_SECTION_SCHEMAS, siteContentSchema } from "@/lib/validations/admin";

const REVALIDATE_PATHS: Record<string, string[]> = {
  homepage_hero: ["/"],
  homepage_logos: ["/"],
  homepage_templates: ["/"],
  homepage_testimonials: ["/"],
  homepage_video: ["/"],
  how_it_works: ["/how-it-works"],
  faq: ["/faq", "/"],
};

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
  let data: Record<string, string> = parsed.data;

  // List sections store one JSON-encoded item per row — validate each item's
  // shape strictly here so a malformed save is rejected outright rather than
  // silently dropped (the read path is intentionally more lenient). Form
  // inputs always send string values (even for the "number" rating field), so
  // persist the zod-coerced result rather than the raw client JSON — that's
  // what guarantees `rating` is actually a number in storage.
  const listSchema = LIST_SECTION_SCHEMAS[section as keyof typeof LIST_SECTION_SCHEMAS];
  if (listSchema) {
    const coerced: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      let json: unknown;
      try {
        json = JSON.parse(value);
      } catch {
        return NextResponse.json({ error: `Invalid JSON for item "${key}"` }, { status: 400 });
      }
      const itemResult = listSchema.safeParse(json);
      if (!itemResult.success) {
        return NextResponse.json(
          { error: `Invalid item "${key}": ${itemResult.error.message}` },
          { status: 400 }
        );
      }
      coerced[key] = JSON.stringify(itemResult.data);
    }
    data = coerced;
  }

  // Full-replace semantics: delete any rows for keys no longer present, then
  // upsert the rest. When data is empty, `notIn: []` matches every existing
  // row for the section — that's intentional (clearing a list).
  await db.$transaction([
    db.siteContent.deleteMany({
      where: { section, key: { notIn: Object.keys(data) } },
    }),
    ...Object.entries(data).map(([key, value]) =>
      db.siteContent.upsert({
        where: { section_key: { section, key } },
        update: { value },
        create: { section, key, value },
      })
    ),
  ]);

  for (const path of REVALIDATE_PATHS[section] ?? []) {
    revalidatePath(path);
  }

  return NextResponse.json({ success: true });
}
