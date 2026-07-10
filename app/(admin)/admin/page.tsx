import Link from "next/link";
import {
  CreditCard,
  Gift,
  Mail,
  FileText,
  Users,
  KeyRound,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";

const SECTIONS: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: "/admin/plans", label: "Plans", description: "Create, edit, and disable plans.", icon: CreditCard },
  {
    href: "/admin/referral-config",
    label: "Referral Config",
    description: "Points per referral, conversion rate, minimum redemption.",
    icon: Gift,
  },
  {
    href: "/admin/email-config",
    label: "Email Config",
    description: "Expiry reminder schedule.",
    icon: Mail,
  },
  {
    href: "/admin/content",
    label: "Site Content",
    description: "Homepage hero, how-it-works, FAQ.",
    icon: FileText,
  },
  { href: "/admin/users", label: "Users", description: "All users, plans, and stats.", icon: Users },
  { href: "/admin/password", label: "Password", description: "Update your admin password.", icon: KeyRound },
];

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={ShieldCheck}
        title="Admin Panel"
        description="Manage plans, pricing, referral points, email reminders, and site content."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex items-start gap-3 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <section.icon className="size-4" />
            </span>
            <div>
              <p className="font-medium">{section.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
