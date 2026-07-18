import { CreditCard } from "lucide-react";

import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { PlanStatsCards } from "@/components/admin/plan-stats-cards";
import { PlansTable } from "@/components/admin/plans-table";

export default async function AdminPlansPage() {
  const [plans, total, active, disabled, totalSubscribers] = await Promise.all([
    db.plan.findMany({
      orderBy: [{ recommended: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { users: true } } },
    }),
    db.plan.count(),
    db.plan.count({ where: { isDraft: false, isActive: true } }),
    db.plan.count({ where: { isDraft: false, isActive: false } }),
    db.user.count({ where: { NOT: { planId: null } } }),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader icon={CreditCard} title="Plans" description="Create, edit, and disable plans." />

      <div className="flex flex-col gap-6">
        <PlanStatsCards stats={{ total, active, disabled, totalSubscribers }} />
        <PlansTable
          initialPlans={plans.map((p) => ({
            id: p.id,
            name: p.name,
            cardType: p.cardType,
            price: p.price,
            validityDays: p.validityDays,
            featuresJson: p.featuresJson,
            maxGalleryImages: p.maxGalleryImages,
            isActive: p.isActive,
            isDraft: p.isDraft,
            recommended: p.recommended,
            subscriberCount: p._count.users,
          }))}
        />
      </div>
    </main>
  );
}
