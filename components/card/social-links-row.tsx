import { SocialIcon, getSocialLabel } from "@/components/card/social-icon";
import type { SocialLink } from "@/lib/card-sections";

function socialHref(link: SocialLink): string {
  if (link.platform === "whatsapp") return `https://wa.me/${link.url.replace(/[^0-9]/g, "")}`;
  return link.url;
}

export function SocialLinksRow({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2 pt-1">
      {links.map((link, i) => (
        <a
          key={i}
          href={socialHref(link)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={getSocialLabel(link.platform)}
          className="flex size-9 items-center justify-center rounded-full bg-muted/50 text-foreground/80 transition-colors hover:bg-[var(--brand)] hover:text-white"
        >
          <SocialIcon platform={link.platform} className="size-4" />
        </a>
      ))}
    </div>
  );
}
