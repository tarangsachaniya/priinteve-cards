import Link from "next/link";
import { BadgeCheckIcon, RefreshCwIcon, ShieldCheckIcon, Wifi } from "lucide-react";

const TRUST_POINTS = [
  { icon: ShieldCheckIcon, label: "Secure by default" },
  { icon: BadgeCheckIcon, label: "No app required" },
  { icon: RefreshCwIcon, label: "Instant profile updates" },
];

export function AuthShell({
  children,
  tagline,
}: {
  children: React.ReactNode;
  tagline: string;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-navy p-10 text-primary-foreground lg:flex">
        <div aria-hidden className="bg-dot absolute inset-0 opacity-[0.15]" />
        <div aria-hidden className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -left-10 size-72 rounded-full bg-black/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/15">
            <Wifi className="size-4" strokeWidth={2.5} />
          </span>
          DigitalCard
        </Link>

        <div className="relative flex flex-col gap-8">
          <p className="max-w-sm text-3xl leading-snug font-semibold text-balance">{tagline}</p>
          <ul className="flex flex-col gap-3">
            {TRUST_POINTS.map((point) => (
              <li key={point.label} className="flex items-center gap-2.5 text-sm text-primary-foreground/90">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/15">
                  <point.icon className="size-3.5" />
                </span>
                {point.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} DigitalCard. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-center border-b border-border/80 px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-navy text-primary-foreground shadow-sm shadow-primary/30">
              <Wifi className="size-4" strokeWidth={2.5} />
            </span>
            DigitalCard
          </Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8">
          <div aria-hidden className="bg-dot pointer-events-none absolute inset-0 -z-10 opacity-40" />
          {children}
        </div>
      </div>
    </main>
  );
}
