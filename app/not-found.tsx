import Link from "next/link";
import { ArrowLeftIcon, SearchXIcon, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div
        aria-hidden
        className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-20 opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"
      />

      <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
        <span className="shadow-card-sm flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-navy text-primary-foreground">
          <Wifi className="size-4" strokeWidth={2.5} />
        </span>
        DigitalCard
      </Link>

      <div className="shadow-glow relative mt-10 flex size-20 items-center justify-center rounded-3xl border border-border/60 bg-card">
        <SearchXIcon className="size-9 text-primary" strokeWidth={1.5} />
      </div>

      <p className="mt-8 text-sm font-semibold tracking-[0.14em] text-primary uppercase">404 error</p>
      <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
        This page took a wrong turn
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        We couldn&apos;t find the page you were looking for. It may have been moved, renamed, or
        never existed.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Button size="xl" render={<Link href="/" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to home
        </Button>
        <Button size="xl" variant="outline" render={<Link href="/contact" />}>
          Contact support
        </Button>
      </div>
    </main>
  );
}
