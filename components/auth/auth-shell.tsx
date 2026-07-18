import Link from "next/link";
import { Nfc, ShieldCheck, Sparkles, Zap } from "lucide-react";

const TRUST_POINTS = [
  { icon: Zap, label: "Instant sharing", detail: "One tap opens your live profile — no app needed." },
  { icon: Sparkles, label: "Always up to date", detail: "Edit your details anytime, everyone sees the latest." },
  { icon: ShieldCheck, label: "Your data, protected", detail: "We never sell your contacts or leads." },
];

export function AuthShell({
  tagline,
  children,
}: {
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink px-14 py-16 lg:flex lg:flex-col lg:items-center lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 h-[36rem] bg-[radial-gradient(ellipse_60%_60%_at_50%_30%,rgba(198,241,53,0.16),transparent_70%)]"
        />

        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-ink">
            <Nfc className="size-4" strokeWidth={2.5} />
          </span>
          Tapcard
        </Link>

        <div className="max-w-sm text-center">
          <h2 className="text-3xl leading-tight font-bold text-balance text-white">{tagline}</h2>

          <div className="mt-10 flex flex-col items-center gap-6">
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className="flex flex-col items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-primary">
                  <point.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{point.label}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{point.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-24 w-full max-w-[16rem]">
          <div className="absolute top-2 right-6 aspect-[1.586/1] w-[70%] rotate-[8deg] rounded-2xl border border-white/10 bg-gradient-to-br from-[#DCEFA8] to-[#AEDB6F] shadow-xl" />
          <div className="absolute top-8 left-0 aspect-[1.586/1] w-[70%] -rotate-[6deg] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#1b1d1a_0%,#111311_60%)] shadow-xl">
            <div className="flex h-full items-center justify-end p-4">
              <Nfc className="size-4 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-16">
        <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold tracking-tight text-foreground lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-ink">
            <Nfc className="size-4" strokeWidth={2.5} />
          </span>
          Tapcard
        </Link>
        {children}
      </div>
    </div>
  );
}
