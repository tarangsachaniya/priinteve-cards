"use client";

import { BadgeCheck, Nfc, Play, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { getYoutubeThumbnail } from "@/lib/youtube";
import { CardGallery } from "@/components/card/card-gallery";
import { ServicesSection } from "@/components/card/services-section";
import { ProductsSection } from "@/components/card/products-section";
import { TestimonialsSection } from "@/components/card/testimonials-section";
import { FaqSection } from "@/components/card/faq-section";
import { ButtonsSection } from "@/components/card/buttons-section";
import { BusinessHoursCard } from "@/components/card/business-hours-card";
import { CustomHtmlBlock } from "@/components/card/custom-html-block";
import { SocialLinksRow } from "@/components/card/social-links-row";
import { cardQrSrc, type CardModel } from "@/components/card/themes/card-data";

/**
 * Pieces every theme shares. The repeatable content sections deliberately reuse
 * the existing components rather than being re-implemented per theme: they are
 * already token-driven (bg-card / text-muted-foreground / var(--brand)) and so
 * pick up the active card palette through the shadcn token remap in
 * app/card-theme.css. `flat` is passed where the theme already supplies the
 * surface, so a section doesn't stack a second card on top of one.
 */

export function VerifiedPill({ onMedia = false }: { onMedia?: boolean }) {
  return (
    <span className={cn("pe-verified", onMedia && "pe-on-media")}>
      <BadgeCheck aria-hidden />
      Verified
    </span>
  );
}

/** Reference's video block: a YouTube item rendered as a branded play frame. */
export function VideoBlock({ url, caption }: { url: string; caption?: string | null }) {
  const thumb = getYoutubeThumbnail(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="pe-video"
      aria-label={caption ? `Play video: ${caption}` : "Play video"}
    >
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      )}
      <span className="pe-video-tex" aria-hidden />
      <span className="pe-play">
        <Play aria-hidden />
      </span>
      {caption && (
        <span className="absolute bottom-3 left-4 text-xs font-semibold text-white drop-shadow">{caption}</span>
      )}
    </a>
  );
}

/**
 * The container class is supplied by the caller: each theme composes `pe-scan`
 * with its own surface (Bento wraps it in a tile, Original in a titled card).
 */
export function ScanBlock({ slug, className }: { slug: string; className?: string }) {
  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cardQrSrc(slug)} alt={`QR code linking to the card at /${slug}`} className="pe-qr" />
      <div>
        <div className="pe-scan-lab">Scan to open this card</div>
        <div className="pe-scan-sub">/{slug}</div>
      </div>
    </div>
  );
}

export function CardFooter() {
  return (
    <div className="pe-footer">
      <span className="pe-made">
        <Nfc aria-hidden />
        Made with PrintEve
      </span>
      <span className="pe-dot" aria-hidden />
      <span>Privacy</span>
      <span className="pe-dot" aria-hidden />
      <span>Terms</span>
    </div>
  );
}

export function SecureNote({ className }: { className?: string }) {
  return (
    <span className={cn("pe-note", className)}>
      <ShieldCheck aria-hidden />
      Paid through your own UPI app
    </span>
  );
}

export type ContentSection = { key: string; title: string; node: React.ReactNode };

/**
 * The repeatable content sections a card can carry, in the order the reference
 * lays them out. Returned as a list rather than rendered, so each theme can wrap
 * them in its own section shell — Original's titled cards, Bento's tiles,
 * Editorial's numbered markers.
 */
export function contentSections(card: CardModel, flat?: boolean): ContentSection[] {
  const sections: ContentSection[] = [];

  if (card.services.length > 0) {
    sections.push({
      key: "services",
      title: "Services",
      node: <ServicesSection services={card.services} flat={flat} showTitle={false} />,
    });
  }
  if (card.products.length > 0) {
    sections.push({
      key: "products",
      title: "Products",
      node: <ProductsSection products={card.products} flat={flat} showTitle={false} />,
    });
  }
  if (card.images.length > 0) {
    sections.push({
      key: "gallery",
      title: "Gallery",
      node: <CardGallery items={card.images} layout="grid" />,
    });
  }
  if (card.businessHours.length > 0) {
    sections.push({
      key: "hours",
      title: "Business Hours",
      node: (
        <div className="flex flex-col gap-3">
          {card.businessHours.map((item, i) => (
            <BusinessHoursCard key={i} hours={item.hours} label={item.label} flat={flat} />
          ))}
        </div>
      ),
    });
  }
  if (card.testimonials.length > 0) {
    sections.push({
      key: "testimonials",
      title: "Testimonials",
      node: <TestimonialsSection testimonials={card.testimonials} showTitle={false} />,
    });
  }
  if (card.faqs.length > 0) {
    sections.push({
      key: "faq",
      title: "FAQ",
      node: <FaqSection items={card.faqs} flat={flat} showTitle={false} />,
    });
  }
  if (card.buttons.length > 0) {
    sections.push({
      key: "buttons",
      title: "Links",
      node: <ButtonsSection items={card.buttons} />,
    });
  }
  if (card.customHtml.length > 0) {
    sections.push({
      key: "custom",
      title: "More",
      node: (
        <div className="flex flex-col gap-3">
          {card.customHtml.map((html, i) => (
            <CustomHtmlBlock key={i} html={html} flat={flat} />
          ))}
        </div>
      ),
    });
  }
  if (card.socials.length > 0) {
    sections.push({
      key: "socials",
      title: "Follow",
      node: <SocialLinksRow links={card.socials} />,
    });
  }

  return sections;
}
