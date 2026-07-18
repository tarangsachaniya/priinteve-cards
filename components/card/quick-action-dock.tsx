"use client";

import { Globe, Mail, MessageCircle, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { mailtoHref, telHref } from "@/lib/contact-links";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SaveContactButton } from "@/components/card/save-contact-button";
import { ShareButton } from "@/components/card/share-button";
import { MotionSection } from "@/components/card/motion-section";

function DockLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            aria-label={label}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <Icon className="size-4" />
          </a>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function QuickActionDock({
  phone,
  email,
  website,
  whatsappUrl,
  slug,
}: {
  phone?: string;
  email?: string;
  website?: string;
  whatsappUrl?: string;
  slug: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex justify-center gap-1.5 border-t border-foreground/10 bg-card/80 px-3 py-2.5 backdrop-blur-lg pb-[calc(env(safe-area-inset-bottom)+0.625rem)]",
        "lg:static lg:w-fit lg:justify-start lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:pb-0 lg:backdrop-blur-none"
      )}
    >
      <MotionSection className="flex flex-wrap items-center gap-1.5">
        {phone && <DockLink href={telHref(phone)} label="Call" icon={Phone} />}
        {whatsappUrl && <DockLink href={whatsappUrl} label="WhatsApp" icon={MessageCircle} />}
        {email && <DockLink href={mailtoHref(email)} label="Email" icon={Mail} />}
        {website && <DockLink href={website} label="Website" icon={Globe} />}
        <ShareButton variant="dock" />
        <SaveContactButton slug={slug} variant="dock" />
      </MotionSection>
    </div>
  );
}
