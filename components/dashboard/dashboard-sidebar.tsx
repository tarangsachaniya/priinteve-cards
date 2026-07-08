"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ListChecks,
  Images,
  Wand2,
  CreditCard,
  Users,
  ExternalLink,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/fields", label: "Fields", icon: ListChecks },
  { href: "/dashboard/gallery", label: "Gallery", icon: Images },
  { href: "/dashboard/setup", label: "Setup", icon: Wand2 },
  { href: "/dashboard/plans", label: "Plans", icon: CreditCard },
  { href: "/dashboard/referrals", label: "Referrals", icon: Users },
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r p-4 md:flex">
        <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <span className="text-sm font-semibold">DigitalCard</span>
        </Link>

        <NavLinks pathname={pathname} />

        <div className="mt-auto flex flex-col gap-1 border-t pt-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ExternalLink className="size-4 shrink-0" />
            View my card
          </a>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex items-center justify-between border-b p-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <span className="text-sm font-semibold">DigitalCard</span>
        </Link>
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
          <div className="mt-2 flex flex-col gap-1 border-t pt-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4 shrink-0" />
              Sign out
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
