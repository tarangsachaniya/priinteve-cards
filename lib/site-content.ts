import { db } from "@/lib/db";

export async function getSiteContentMap(section: string): Promise<Record<string, string>> {
  const rows = await db.siteContent.findMany({ where: { section }, orderBy: { key: "asc" } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getSiteContentEntries(section: string) {
  return db.siteContent.findMany({ where: { section }, orderBy: { key: "asc" } });
}

export async function getSiteContentList<T>(section: string): Promise<T[]> {
  const rows = await getSiteContentEntries(section);
  const items: T[] = [];
  for (const row of rows) {
    try {
      items.push(JSON.parse(row.value) as T);
    } catch {
      // Skip malformed rows rather than failing the whole page render.
    }
  }
  return items;
}
