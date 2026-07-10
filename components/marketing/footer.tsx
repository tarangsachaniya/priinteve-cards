import Link from "next/link";
import { ArrowRightIcon, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";

const PRODUCT_LINKS = [
  { href: "/products/nfc-card", label: "NFC Card" },
  { href: "/products/qr-code", label: "QR Code" },
  { href: "/products/nfc-and-qr", label: "NFC + QR" },
  { href: "/pricing", label: "Pricing" },
];

const COMPANY_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Log in" },
];

const SOCIAL_LINKS = [
  { href: "https://twitter.com", label: "Twitter" },
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://linkedin.com", label: "LinkedIn" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-emerald-800">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]"
        />
        <div className="relative mx-auto flex max-w-[1360px] flex-col items-center gap-6 px-6 py-14 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-primary-foreground">
              Ready to make a great first impression?
            </p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Get your digital card set up in minutes — no app required.
            </p>
          </div>
          <Button
            size="xl"
            variant="secondary"
            className="shrink-0"
            render={<Link href="/signup" />}
          >
            Get Your Card
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1360px] gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-14">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span className="shadow-card-sm flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
              <Wifi className="size-4" strokeWidth={2.5} />
            </span>
            DigitalCard
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Share who you are with a single tap or scan — one card, every way to connect.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">Products</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Company</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Follow</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-5">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} DigitalCard. All rights reserved.</p>
          <p>Made for professionals who network.</p>
        </div>
      </div>
    </footer>
  );
}
