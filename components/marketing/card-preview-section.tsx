import {
  ExternalLinkIcon,
  GlobeIcon,
  MailIcon,
  MessageCircleIcon,
  PaletteIcon,
  PhoneIcon,
  PlayIcon,
  RefreshCwIcon,
  Share2Icon,
  Sparkles,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SocialIcon } from "@/components/card/social-icon";
import { cn } from "@/lib/utils";

const PREVIEW_POINTS = [
  { title: "Contact fields", description: "Phone, email, address, bio, and more — each one tap-to-action." },
  { title: "Company details", description: "Your company name, tagline, and a link straight to your site." },
  { title: "Services", description: "Showcase what you offer as tappable cards right on your profile." },
  { title: "Gallery & testimonials", description: "Photos, YouTube videos, and client reviews, all in one scroll." },
  { title: "One-tap actions", description: "Call, WhatsApp, email, share, or save to contacts — instantly." },
];

const FIELD_ROWS = [
  { icon: PhoneIcon, label: "Phone", value: "+91 98765 43210" },
  { icon: MailIcon, label: "Email", value: "jordan@nimbusstudio.co" },
];

const SERVICES = [
  { icon: Sparkles, title: "Design Sprint", description: "A focused week to define your next product." },
  { icon: PaletteIcon, title: "UI Audit", description: "A detailed pass on usability and visual consistency." },
  { icon: RefreshCwIcon, title: "Retainer", description: "Ongoing design support for growing teams." },
];

const DOCK_ICONS = [PhoneIcon, MessageCircleIcon, MailIcon, GlobeIcon, Share2Icon, RefreshCwIcon];

function CardPreviewContent() {
  return (
    <>
      <div className="h-20 w-full bg-gradient-to-br from-primary to-emerald-800" />

      <div className="-mt-10 flex flex-col items-center gap-1.5 px-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-full text-base font-semibold text-white ring-4 ring-card bg-gradient-to-br from-primary to-emerald-700">
          JS
        </div>
        <h3 className="mt-1 text-base font-semibold">Jordan Smith</h3>
        <p className="text-xs text-muted-foreground">Product Designer</p>

        <div className="mt-3 flex w-full flex-col items-center gap-2 rounded-2xl bg-muted/50 px-4 py-4">
          <p className="text-sm font-semibold">Nimbus Studio</p>
          <p className="text-xs text-muted-foreground">Product &amp; brand design</p>
          <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[10.5px] font-medium text-primary-foreground">
            Visit Website
            <ExternalLinkIcon className="size-3" />
          </span>
        </div>

        <div className="mt-2.5 flex w-full flex-col gap-1.5">
          {FIELD_ROWS.map((field) => (
            <div
              key={field.label}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-left text-[11.5px]"
            >
              <field.icon className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">
                <span className="font-medium">{field.label}:</span> {field.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-1 flex items-center justify-center gap-2">
          {["linkedin", "instagram", "x"].map((platform) => (
            <span
              key={platform}
              className="flex size-8 items-center justify-center rounded-full bg-muted/50 text-foreground/80 ring-1 ring-foreground/10"
            >
              <SocialIcon platform={platform} className="size-3.5" />
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5">
          {DOCK_ICONS.map((Icon, index) => (
            <span
              key={index}
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-7.5 shrink-0")}
            >
              <Icon className="size-3.5" />
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 px-5 pb-5 text-left">
        <div className="flex flex-col gap-2">
          <h4 className="px-1 text-xs font-semibold text-foreground/90">Services</h4>
          <div className="grid grid-cols-1 gap-2">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="flex flex-col gap-1 rounded-xl bg-card p-3 text-[11.5px] shadow-sm ring-1 ring-foreground/10"
              >
                <service.icon className="size-4 shrink-0 text-primary" />
                <span className="font-medium">{service.title}</span>
                <span className="text-[10.5px] text-muted-foreground">{service.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="px-1 text-xs font-semibold text-foreground/90">Testimonials</h4>
          <div className="flex flex-col gap-1.5 rounded-xl bg-card p-3 text-[11.5px] shadow-sm ring-1 ring-foreground/10">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, star) => (
                <Star key={star} className="size-3 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-foreground/90">
              &ldquo;Jordan turned our brand around in two weeks flat.&rdquo;
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              <span className="font-medium text-foreground/80">Priya Nair</span> — Founder
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["bg-primary/15", "bg-emerald-500/15", "bg-muted", "bg-primary/10"].map((tone, index) => (
            <div
              key={index}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md ring-1 ring-foreground/10",
                tone
              )}
            >
              {index === 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                  <PlayIcon className="size-6 fill-white text-white drop-shadow" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function CardPreviewSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-28" id="preview">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
            Live demo
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Your whole business, behind one profile
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            This is the same card layout your visitors see — built from the fields, services, and
            gallery you set up in your dashboard.
          </p>

          <ul className="mt-8 flex flex-col gap-5">
            {PREVIEW_POINTS.map((point, index) => (
              <li key={point.title} className="flex gap-3.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{point.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto hidden w-full max-w-[300px] lg:block">
          <div className="relative rounded-[2.75rem] border border-border/80 bg-foreground p-3 shadow-2xl">
            <div
              aria-hidden
              className="absolute top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-foreground"
            />
            <div className="flex h-[600px] flex-col overflow-hidden rounded-[2.1rem] bg-card">
              <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                <CardPreviewContent />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border/70 bg-card shadow-elevated lg:hidden">
          <CardPreviewContent />
        </div>
      </div>
    </section>
  );
}
