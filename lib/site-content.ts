import { db } from "@/lib/db";

export async function getSiteContentMap(section: string): Promise<Record<string, string>> {
  const rows = await db.siteContent.findMany({ where: { section }, orderBy: { key: "asc" } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getSiteContentEntries(section: string) {
  return db.siteContent.findMany({ where: { section }, orderBy: { key: "asc" } });
}
