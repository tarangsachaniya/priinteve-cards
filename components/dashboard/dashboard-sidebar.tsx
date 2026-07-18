"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, Menu, Nfc, Shield } from "lucide-react";
import { useState } from "react";

import { DASHBOARD_NAV_ITEMS } from "@/lib/nav-config";
import { NavItemLink } from "@/components/dashboard/nav-item";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const VISIBLE_NAV_ITEMS = DASHBOARD_NAV_ITEMS.filter((item) => item.href !== "/dashboard/referrals");

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <>
      {VISIBLE_NAV_ITEMS.map((item) => (
        <NavItemLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={Boolean(pathname === item.href || pathname?.startsWith(`${item.href}/`))}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

function SidebarFooter({
  isAdmin,
  slug,
  onNavigate,
}: {
  isAdmin?: boolean;
  slug?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Shield className="size-4 shrink-0" />
          Admin panel
        </Link>
      )}
      {slug && (
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-4 shrink-0" />
          View my card
        </a>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2.5 rounded-full px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4 shrink-0" />
        Sign out
      </button>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-ink">
        <Nfc className="size-4" strokeWidth={2.5} />
      </span>
      Tapcard
    </Link>
  );
}

export function DashboardSidebar({ isAdmin, slug }: { isAdmin?: boolean; slug?: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-border bg-card p-4 md:flex">
        <Logo />
        <NavLinks pathname={pathname} />
        <SidebarFooter isAdmin={isAdmin} slug={slug} />
      </nav>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 p-3 backdrop-blur-md md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-ink">
            <Nfc className="size-3.5" strokeWidth={2.5} />
          </span>
          Tapcard
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Toggle navigation" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent className="left-0 right-auto flex-col slide-in-from-left data-closed:slide-out-to-left">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo />
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter isAdmin={isAdmin} slug={slug} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
