import { Gift } from "lucide-react";

import { ReferralConfigForm } from "@/components/admin/referral-config-form";
import { PageHeader } from "@/components/shared/page-header";
import { getReferralConfig } from "@/lib/settings";

export default async function AdminReferralConfigPage() {
  const config = await getReferralConfig();

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader
        icon={Gift}
        title="Referral config"
        description="Configure referral rewards and wallet redemption rules."
      />

      <ReferralConfigForm initialValues={config} />
    </main>
  );
}
