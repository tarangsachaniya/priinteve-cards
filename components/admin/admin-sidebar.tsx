"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";

import { ADMIN_NAV_SECTIONS } from "@/lib/nav-config";
import { NavItemLink } from "@/components/dashboard/nav-item";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <>
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <p className="px-2.5 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:pt-0">
            {section.label}
          </p>
          {section.items.map((item) => (
            <NavItemLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={Boolean(pathname === item.href || pathname?.startsWith(`${item.href}/`))}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function ProfileFooter({ userEmail }: { userEmail: string }) {
  const initial = userEmail.charAt(0).toUpperCase() || "A";

  return (
    <div className="flex flex-col gap-1 border-t pt-3">
      <div className="flex items-center gap-2.5 px-2.5 py-1.5">
        <Avatar size="sm">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">{userEmail}</span>
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

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r bg-card/40 p-4 md:flex">
        <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          <NavLinks pathname={pathname} />
        </div>
        <ProfileFooter userEmail={userEmail} />
      </nav>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/85 p-3 backdrop-blur-md md:hidden">
        <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Toggle navigation" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent className="left-0 right-auto flex-col slide-in-from-left data-closed:slide-out-to-left">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <ProfileFooter userEmail={userEmail} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
