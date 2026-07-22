"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Nfc, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomepageNavbar } from "@/lib/site-content";

export function Navbar({ content }: { content: HomepageNavbar }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const NAV_LINKS = [
    { href: "#features", label: content.navFeatures },
    { href: "#how-it-works", label: content.navHowItWorks },
    { href: "#pricing", label: content.navPricing },
    { href: "#faq", label: content.navFaq },
    { href: "#contact", label: content.navContact },
  ];

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
          <span className={cn(transparent ? "text-white" : "text-foreground")}>{content.brandName}</span>
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
          <Link
            href="/login"
            className={cn(
              "text-sm font-medium transition-colors",
              transparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {content.loginLabel}
          </Link>
          <Button size="sm" render={<Link href="/signup" />}>
            {content.ctaLabel}
          </Button>
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
            <Button variant="outline" size="sm" render={<Link href="/login" />}>
              {content.loginLabel}
            </Button>
            <Button size="sm" render={<Link href="/signup" />}>
              {content.ctaLabel}
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
