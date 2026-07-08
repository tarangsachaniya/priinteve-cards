import { Mail } from "lucide-react";

import { EmailConfigForm } from "@/components/admin/email-config-form";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";

export default async function AdminEmailConfigPage() {
  const row = await db.siteContent.findUnique({
    where: { section_key: { section: "email_config", key: "expiryReminders" } },
  });

  const initialRules: { daysBeforeExpiry: number }[] = row ? JSON.parse(row.value) : [];

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader
        icon={Mail}
        title="Email Config"
        description="Configure how many days before expiry reminder emails are sent."
      />

      <EmailConfigForm initialRules={initialRules} />
    </main>
  );
}
