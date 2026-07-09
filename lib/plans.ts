import { db } from "@/lib/db";

export function getActivePlans() {
  return db.plan.findMany({
    where: { isActive: true, isDraft: false },
    orderBy: [{ recommended: "desc" }, { price: "asc" }],
  });
}
