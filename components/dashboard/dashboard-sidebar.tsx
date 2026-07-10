"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, Menu, Shield } from "lucide-react";
import { useState } from "react";

import { DASHBOARD_NAV_ITEMS } from "@/lib/nav-config";
import { NavItemLink } from "@/components/dashboard/nav-item";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <>
      {DASHBOARD_NAV_ITEMS.map((item) => (
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

function SidebarFooter({ isAdmin, onNavigate }: { isAdmin?: boolean; onNavigate?: () => void }) {
  return (
    <div className="mt-auto flex flex-col gap-1 border-t pt-3">
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Shield className="size-4 shrink-0" />
          Admin Panel
        </Link>
      )}
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
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        D
      </span>
      <span className="text-sm font-semibold">DigitalCard</span>
    </Link>
  );
}

export function DashboardSidebar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r bg-card/40 p-4 md:flex">
        <Logo />
        <NavLinks pathname={pathname} />
        <SidebarFooter isAdmin={isAdmin} />
      </nav>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/85 p-3 backdrop-blur-md md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <span className="text-sm font-semibold">DigitalCard</span>
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
            <SidebarFooter isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
