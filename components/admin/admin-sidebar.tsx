"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  CreditCard,
  Gift,
  Mail,
  FileText,
  Users,
  KeyRound,
  Menu,
  IdCard,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_SECTIONS = [
  {
    label: "General",
    items: [{ href: "/dashboard", label: "My Card", icon: IdCard }],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/plans", label: "Plans", icon: CreditCard },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/referral-config", label: "Referral Config", icon: Gift },
      { href: "/admin/email-config", label: "Email Config", icon: Mail },
      { href: "/admin/content", label: "Site Content", icon: FileText },
      { href: "/admin/password", label: "Password", icon: KeyRound },
    ],
  },
];

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <p className="px-2.5 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:pt-0">
            {section.label}
          </p>
          {section.items.map((item) => {
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
        </div>
      ))}
    </>
  );
}

function ProfileFooter() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "A";

  return (
    <div className="flex flex-col gap-1 border-t pt-3">
      <div className="flex items-center gap-2.5 px-2.5 py-1.5">
        <Avatar size="sm">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">{email}</span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4 shrink-0" />
        Sign out
      </button>
    </div>
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
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          <NavLinks pathname={pathname} />
        </div>
        <ProfileFooter />
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
          <div className="mt-2">
            <ProfileFooter />
          </div>
        </nav>
      )}
    </>
  );
}
