import { CreditCard } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlansTable } from "@/components/admin/plans-table";

export default function AdminPlansPage() {
  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <PageHeader
        icon={CreditCard}
        title="Plans"
        description="Manage all subscription plans available for digital business cards."
      />
      <PlansTable />
    </main>
  );
}
