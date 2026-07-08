"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Gift,
  Mail,
  FileText,
  Users,
  KeyRound,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/referral-config", label: "Referral Config", icon: Gift },
  { href: "/admin/email-config", label: "Email Config", icon: Mail },
  { href: "/admin/content", label: "Site Content", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/password", label: "Password", icon: KeyRound },
];

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r p-4 md:flex">
        <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
        <NavLinks pathname={pathname} />
      </nav>

      <div className="flex items-center justify-between border-b p-3 md:hidden">
        <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          aria-label="Toggle navigation"
        >
          <Menu className="size-5" />
        </button>
      </div>
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-b p-3 md:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>
      )}
    </>
  );
}
