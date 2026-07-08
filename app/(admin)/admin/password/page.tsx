import { KeyRound } from "lucide-react";

import { UpdatePasswordForm } from "@/components/shared/update-password-form";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminPasswordPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader icon={KeyRound} title="Password" description="Update your admin account password." />

      <UpdatePasswordForm />
    </main>
  );
}
