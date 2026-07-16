import Link from "next/link";
import { Nfc } from "lucide-react";

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.6 10.3 20 3h-1.6l-5.5 6.4L8.5 3H3l6.8 9.6L3 21h1.6l5.9-6.8 4.7 6.8H21l-7.4-10.7Zm-2.1 2.4-.7-1L5.5 4.2h2.4l4.4 6.1.7 1 5.6 7.9h-2.4l-4.7-6.9Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.5.5.9 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45.53c.64-.25 1.37-.42 2.43-.47C8.94.01 9.28 0 12 0Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.24a3.24 3.24 0 1 1 0-6.48 3.24 3.24 0 0 1 0 6.48ZM17.4 4.6a1.17 1.17 0 1 0 0 2.34 1.17 1.17 0 0 0 0-2.34Z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Templates", href: "#templates" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "mailto:hello@tapcard.co" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Support", href: "#" },
      { label: "Team plans", href: "#" },
      { label: "Shipping", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
      { label: "Refund policy", href: "#" },
    ],
  },
];

const SOCIALS = [
  { icon: TwitterIcon, href: "https://twitter.com", label: "Twitter" },
  { icon: InstagramIcon, href: "https://instagram.com", label: "Instagram" },
  { icon: LinkedinIcon, href: "https://linkedin.com", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="bg-ink pt-20 pb-8 text-white">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-ink">
                <Nfc className="size-4" strokeWidth={2.5} />
              </span>
              Tapcard
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              The last business card you&apos;ll ever need — one tap, every way to connect.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-white/15 text-ink-muted transition-colors hover:border-white/30 hover:text-white"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="text-sm font-semibold text-white">{column.heading}</p>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-ink-muted">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Tapcard. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="#" className="hover:text-white">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
