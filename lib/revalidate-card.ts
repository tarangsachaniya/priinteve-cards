import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function revalidateUserCard(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { slug: true } });
  if (user) {
    revalidatePath(`/${user.slug}`);
  }
}
