import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATS = [
  { label: "Total taps & scans", value: "2,481", delta: "+18% vs last month" },
  { label: "Profile views", value: "6,930", delta: "+9% vs last month" },
  { label: "Contacts saved", value: "842", delta: "+24% vs last month" },
  { label: "New leads", value: "137", delta: "+12% vs last month" },
];

const BARS = [38, 52, 44, 61, 55, 70, 48, 64, 58, 76, 66, 82, 71, 90];

const LEADS = [
  { initials: "AM", name: "Aditi Mehra", tag: "Contacted" },
  { initials: "RK", name: "Ravi Kumar", tag: "New" },
  { initials: "SN", name: "Sara Nair", tag: "New" },
  { initials: "DP", name: "Devansh Patel", tag: "Contacted" },
];

export function AnalyticsShowcaseSection() {
  return (
    <section className="border-y border-border/60 bg-section-alt py-24 md:py-28">
      <div className="mx-auto max-w-[1360px] px-6">
      <div className="reveal-on-scroll bg-analytics-panel shadow-card-xl relative overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-[28rem] bg-[radial-gradient(600px_300px_at_85%_0%,_rgba(16,185,129,0.4),_transparent_70%)]"
        />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <Badge
              variant="outline"
              className="h-auto rounded-full border-white/20 bg-white/10 px-3 py-1 text-white"
            >
              Analytics
            </Badge>
            <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Know exactly who&apos;s engaging
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/65">
              Every tap, scan, and click reported back in real time — so you know which
              conversations turned into pipeline.
            </p>
          </div>
          <Button variant="secondary" size="sm" render={<Link href="/how-it-works" />}>
            See how it works
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>

        <div className="relative mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]"
            >
              <p className="font-mono text-[11px] text-white/55">{stat.label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-xs text-emerald-400">{stat.delta}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
            <p className="font-mono text-xs text-white/70">Scans &amp; taps — last 14 days</p>
            <div className="mt-5 flex h-28 items-end gap-1.5 sm:gap-2">
              {BARS.map((height, index) => (
                <div
                  key={index}
                  style={{ height: `${height}%` }}
                  className="flex-1 rounded-t-[3px] bg-gradient-to-t from-emerald-600 to-emerald-400 transition-[height] duration-500"
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
            <p className="font-mono text-xs text-white/70">Recent leads</p>
            <div className="mt-3.5 flex flex-col">
              {LEADS.map((lead) => (
                <div
                  key={lead.name}
                  className="flex items-center justify-between border-b border-white/8 py-2.5 text-sm last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10.5px] font-semibold">
                      {lead.initials}
                    </span>
                    {lead.name}
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400">{lead.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
