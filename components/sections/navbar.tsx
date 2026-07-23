"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { Crown, ExternalLink, LayoutDashboard, LogOut, Menu, Nfc, Shield, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export type NavbarUser = {
  role: Role;
  cardPublished: boolean;
  slug: string | null;
  name?: string | null;
  email?: string | null;
};

function initialsFor(user: NavbarUser) {
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return user.email?.[0]?.toUpperCase() ?? "?";
}

function ProfileMenu({ user, transparent }: { user: NavbarUser; transparent: boolean }) {
  const isAdmin = user.role === "ADMIN";
  const hasCard = user.cardPublished;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account menu"
            className="flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <Avatar>
          <AvatarFallback className={cn(transparent && "bg-white/15 text-white")}>
            {initialsFor(user)}
          </AvatarFallback>
          {hasCard && (
            <AvatarBadge>
              <Crown />
            </AvatarBadge>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <Shield />
            Admin panel
          </DropdownMenuItem>
        )}
        {!isAdmin && !hasCard && (
          <DropdownMenuItem render={<Link href="/setup" />}>
            <Wand2 />
            Continue setup
          </DropdownMenuItem>
        )}
        {!isAdmin && hasCard && (
          <DropdownMenuItem render={<Link href="/dashboard" />}>
            <LayoutDashboard />
            Dashboard
          </DropdownMenuItem>
        )}
        {!isAdmin && hasCard && user.slug && (
          <DropdownMenuItem render={<a href={`/${user.slug}`} target="_blank" rel="noreferrer" />}>
            <ExternalLink />
            View my card
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar({ user }: { user: NavbarUser | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = !scrolled && !open;

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        transparent ? "bg-transparent py-6" : "bg-background/90 py-3 shadow-sm backdrop-blur-xl"
      )}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 lg:px-20">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Nfc className="size-4" strokeWidth={2.5} />
          </span>
          <span className={cn(transparent ? "text-white" : "text-foreground")}>Tapcard</span>
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-8 text-sm font-medium md:flex",
            transparent ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className={cn(
                "transition-colors",
                transparent ? "hover:text-white" : "hover:text-foreground"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          {user ? (
            <ProfileMenu user={user} transparent={transparent} />
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "text-sm font-medium transition-colors",
                  transparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Log in
              </Link>
              <Button size="sm" render={<Link href="/signup" />}>
                Get your card
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex size-9 items-center justify-center rounded-full md:hidden",
            transparent ? "text-white" : "text-foreground"
          )}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="mx-4 mt-3 flex flex-col gap-1 rounded-2xl border border-border bg-background p-4 shadow-lg md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            {user ? (
              <>
                {user.role !== "ADMIN" && !user.cardPublished && (
                  <Button variant="outline" size="sm" render={<Link href="/setup" onClick={() => setOpen(false)} />}>
                    Continue setup
                  </Button>
                )}
                {user.role !== "ADMIN" && user.cardPublished && (
                  <Button size="sm" render={<Link href="/dashboard" onClick={() => setOpen(false)} />}>
                    Dashboard
                  </Button>
                )}
                {user.role === "ADMIN" && (
                  <Button size="sm" render={<Link href="/admin" onClick={() => setOpen(false)} />}>
                    Admin panel
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" render={<Link href="/login" />}>
                  Log in
                </Button>
                <Button size="sm" render={<Link href="/signup" />}>
                  Get your card
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
