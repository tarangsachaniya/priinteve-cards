"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wifi, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const threshold = Math.min(560, window.innerHeight * 0.75);
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled && !open;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        transparent
          ? "border-transparent bg-transparent"
          : "border-border/60 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/55"
      )}
    >
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 text-lg font-semibold tracking-tight transition-colors",
            transparent && "text-white"
          )}
        >
          <span className="shadow-card-sm flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-navy text-primary-foreground transition-transform duration-300 hover:scale-105">
            <Wifi className="size-4" strokeWidth={2.5} />
          </span>
          DigitalCard
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-1 text-sm font-medium md:flex",
            transparent ? "text-white/65" : "text-muted-foreground"
          )}
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 transition-colors duration-200",
                  transparent
                    ? "hover:bg-white/10 hover:text-white"
                    : "hover:bg-muted/40 hover:text-foreground",
                  active && (transparent ? "bg-white/10 text-white" : "bg-muted/50 text-foreground")
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            className={cn(transparent && "text-white hover:bg-white/10 hover:text-white")}
            render={<Link href="/login" />}
          >
            Log in
          </Button>
          <Button render={<Link href="/signup" />}>Get Your Card</Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-colors md:hidden",
            transparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted/60"
          )}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur-md md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
            <Button variant="outline" render={<Link href="/login" />}>
              Log in
            </Button>
            <Button render={<Link href="/signup" />}>Get Your Card</Button>
          </div>
        </nav>
      )}
    </header>
  );
}
