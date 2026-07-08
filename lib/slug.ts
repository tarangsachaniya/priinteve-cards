import { randomBytes } from "crypto";

import { db } from "@/lib/db";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(name: string, company?: string): Promise<string> {
  const base = slugify(company ? `${name}-${company}` : name) || "user";

  let candidate = base;
  let suffix = 1;
  while (await db.user.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

export async function generateUniqueReferralCode(): Promise<string> {
  let code: string;
  let existing;
  do {
    code = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
    existing = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  } while (existing);

  return code;
}
