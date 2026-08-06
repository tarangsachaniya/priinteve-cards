"use client";

import { ArrowUpRight, ChevronRight, Download, User, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { SaveContactButton } from "@/components/card/save-contact-button";
import { ShareButton } from "@/components/card/share-button";
import { buildCardModel, upiPayHref, type CardModel } from "@/components/card/themes/card-data";
import {
  CardFooter,
  ScanBlock,
  SecureNote,
  VerifiedPill,
  VideoBlock,
  contentSections,
} from "@/components/card/themes/theme-parts";
import type { ThemeCardData } from "@/components/card/theme-card";

/**
 * 1b — "Bento: modular tile grid" (PrintEve/printeve-card-options-web.html).
 *
 * A dashboard-style grid of floating tiles with monospace numerics. Desktop
 * splits into a sticky 380px rail and a 4-column main grid.
 */

function Hero({ card }: { card: CardModel }) {
  const image = card.photo;

  return (
    <header className="pe-hero">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={card.name} />
      ) : (
        <span className="pe-hero-ph">
          <User aria-hidden />
        </span>
      )}
      <span className="pe-scrim" aria-hidden />
      <VerifiedPill onMedia />
      <div className="pe-hero-meta">
        <h1 className={cn("pe-name", card.headingFont)}>{card.name}</h1>
        {card.designation && <p className="pe-role">{card.designation}</p>}
        {card.company && (
          <p className="pe-company">
            <span className="pe-bar" aria-hidden />
            {card.company}
          </p>
        )}
      </div>
    </header>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="pe-ey pe-sec-h">{children}</h2>;
}

export function BentoTheme({ data }: { data: ThemeCardData }) {
  const card = buildCardModel(data);
  const sections = contentSections(card, true);
  const video = card.videos[0];

  return (
    <div className={cn("pe-bngrid", card.bodyFont)}>
      {/* left rail on desktop; the first tiles on mobile */}
      <div className="pe-side">
        <Hero card={card} />

        <SaveContactButton slug={card.slug} variant="unstyled" className="pe-btn pe-save" label="Save Contact" />
        <ShareButton variant="unstyled" className="pe-btn pe-vcard" label="Share" />

        {card.tagline && (
          <div className="pe-tag-tile">
            <span className="pe-acc" aria-hidden />
            <div>
              <div className="pe-cat">About</div>
              <p className="pe-q">{card.tagline}</p>
            </div>
          </div>
        )}
      </div>

      <div className="pe-main">
        {card.contacts.length > 0 && (
          <>
            <SectionHeading>Get In Touch</SectionHeading>
            <div className="pe-rows">
              {card.contacts.map((contact) => (
                <a
                  key={contact.type}
                  className="pe-row"
                  href={contact.href}
                  target={contact.external ? "_blank" : undefined}
                  rel={contact.external ? "noopener noreferrer" : undefined}
                >
                  <span className="pe-row-ic">
                    <contact.icon aria-hidden />
                  </span>
                  <span className="pe-row-b">
                    <span className="pe-row-lab">{contact.label}</span>
                    <span className="pe-row-val">{contact.value}</span>
                  </span>
                  <span className="pe-row-go">
                    <ChevronRight aria-hidden />
                  </span>
                </a>
              ))}
            </div>
          </>
        )}

        {card.stats.length > 0 && (
          <div className="pe-tile pe-stats">
            {card.stats.map((stat) => (
              <div key={stat.label} className="pe-stat">
                <div className="pe-stat-num">{stat.value}</div>
                <div className="pe-stat-cap">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {card.about && (
          <div className="pe-tile pe-about">
            <div className="pe-ey">About</div>
            <p className="mt-3">{card.about}</p>
            {card.website && (
              <div className="pe-chips">
                <a className="pe-chip" href={card.website.href} target="_blank" rel="noopener noreferrer">
                  {card.website.value.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>
        )}

        {video && <VideoBlock url={video.url} caption={video.caption} />}

        {sections.map((section) => (
          <div key={section.key} className="pe-tile pe-span2">
            <div className="pe-ey mb-3">{section.title}</div>
            {section.node}
          </div>
        ))}

        {card.textBlocks.length > 0 && (
          <>
            <SectionHeading>Details</SectionHeading>
            <div className="pe-rows">
              {card.textBlocks.map((block, i) => (
                <div key={i} className="pe-row">
                  <span className="pe-row-b">
                    <span className="pe-row-lab">{block.label}</span>
                    <span className="pe-row-val">{block.body}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {card.payment && (
          <div className="pe-tile pe-pay">
            <div className="pe-ey mb-3">Payments</div>
            {card.payment.upiId && (
              <div className="pe-upi-box">
                <div>
                  <div className="pe-upi-lab">UPI ID</div>
                  <div className="pe-upi-id">{card.payment.upiId}</div>
                </div>
              </div>
            )}
            <div className="pe-payrow">
              {card.payment.upiId && (
                <a className="pe-pay-btn" href={upiPayHref(card.payment.upiId, card.name)}>
                  <Wallet aria-hidden />
                  Pay via UPI
                </a>
              )}
              {card.payment.upiQr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.payment.upiQr} alt="UPI payment QR code" className="pe-qr" />
              )}
            </div>
            <SecureNote />
          </div>
        )}

        {card.files.length > 0 && (
          <>
            <SectionHeading>Files</SectionHeading>
            <div className="pe-rows">
              {card.files.map((file, i) => (
                <a key={i} className="pe-row" href={file.url} target="_blank" rel="noopener noreferrer">
                  <span className="pe-row-ic">
                    <Download aria-hidden />
                  </span>
                  <span className="pe-row-b">
                    <span className="pe-row-name">{file.label}</span>
                  </span>
                  <span className="pe-row-go">
                    <ArrowUpRight aria-hidden />
                  </span>
                </a>
              ))}
            </div>
          </>
        )}

        <ScanBlock slug={card.slug} className="pe-tile pe-scan" />

        <CardFooter />
      </div>
    </div>
  );
}
