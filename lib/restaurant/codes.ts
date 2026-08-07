import { randomBytes } from "crypto";

import { db } from "@/lib/db";

/**
 * Slugs and table codes for the restaurant ordering module.
 * Mirrors the generate-and-retry shape of generateUniqueSlug /
 * generateUniqueReferralCode in lib/slug.ts.
 */

// Static sibling segments under /order/[slug], which would shadow a
// restaurant slug or table code of the same name.
const RESERVED_RESTAURANT_SLUGS = new Set(["status", "api", "order", "r"]);
const RESERVED_TABLE_CODES = new Set(["status"]);

// No vowels and no look-alike characters (0/o, 1/l/i), so a code read off a
// printed QR card can't be mistyped into someone else's table.
const CODE_ALPHABET = "23456789bcdfghjkmnpqrstvwxyz";
const TABLE_CODE_LENGTH = 8;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export async function generateUniqueRestaurantSlug(
  name: string,
  excludeRestaurantId?: string
): Promise<string> {
  const base = slugify(name) || "restaurant";

  let candidate = base;
  let suffix = 1;
  while (true) {
    if (!RESERVED_RESTAURANT_SLUGS.has(candidate)) {
      const owner = await db.restaurant.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!owner || owner.id === excludeRestaurantId) break;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

export async function generateUniqueTableCode(): Promise<string> {
  while (true) {
    const candidate = randomCode(TABLE_CODE_LENGTH);
    if (RESERVED_TABLE_CODES.has(candidate)) continue;
    const existing = await db.restaurantTable.findUnique({
      where: { code: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
}

/** Initial password handed to a restaurant owner when an admin creates them. */
export function generateInitialPassword(): string {
  return randomBytes(6).toString("base64url").slice(0, 10);
}
