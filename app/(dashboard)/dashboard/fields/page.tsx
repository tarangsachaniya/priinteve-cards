import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ListChecks } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { FieldsManager } from "@/components/dashboard/fields-manager";
import { PageHeader } from "@/components/shared/page-header";

export default async function FieldsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const fields = await db.cardField.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <PageHeader
        icon={ListChecks}
        title="Fields"
        description="Choose which contact details appear on your card."
      />
      <FieldsManager initialFields={fields} />
    </main>
  );
}
