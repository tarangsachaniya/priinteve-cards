import { Users } from "lucide-react";

import { UsersPanel } from "@/components/admin/users-panel";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";

export default async function AdminUsersPage() {
  const plans = await db.plan.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader
        icon={Users}
        title="Users"
        description="All users, their plans, expiry, card views, and referrals made."
      />

      <UsersPanel plans={plans} />
    </main>
  );
}
