import { randomBytes } from "crypto";

import { db } from "@/lib/db";

// Top-level app segments that must never be shadowed by a user card slug,
// which is served from the catch-all app/[slug] route. A static segment wins
// over [slug] in Next.js routing, so a user holding one of these would get a
// silently dead card.
const RESERVED_SLUGS = new Set(["order", "r", "api", "admin", "dashboard", "login", "signup"]);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(
  name: string,
  company?: string,
  excludeUserId?: string
): Promise<string> {
  const base = slugify(company ? `${name}-${company}` : name) || "user";

  let candidate = base;
  let suffix = 1;
  while (true) {
    if (!RESERVED_SLUGS.has(candidate)) {
      const owner = await db.user.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!owner || owner.id === excludeUserId) break;
    }
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
