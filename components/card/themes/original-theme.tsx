"use client";

import { ArrowUpRight, Building2, Download, Globe, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { SaveContactButton } from "@/components/card/save-contact-button";
import { ShareButton } from "@/components/card/share-button";
import {
  buildCardModel,
  initialOf,
  upiPayHref,
  type CardModel,
} from "@/components/card/themes/card-data";
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
 * 1a — "Original: photo-first list" (PrintEve/printeve-card-options-web.html).
 *
 * A LinkedIn-style profile: banner with the avatar sitting on it, then a stack
 * of titled cards. Desktop keeps a single centred 840px column.
 */

function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pe-sec", className)}>
      {title && (
        <header className="pe-sec-h">
          <h2 className="pe-t">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function ProfileHead({ card }: { card: CardModel }) {
  return (
    <header className="pe-phead">
      <div
        className={cn("pe-phead-banner", card.coverImage && "pe-has-cover")}
        style={card.coverImage ? { backgroundImage: `url(${card.coverImage})` } : undefined}
      />
      <div className="pe-phead-body">
        <div className="pe-avatar">
          {card.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.photo} alt={card.name} />
          ) : (
            <span className="pe-initial">{initialOf(card.name)}</span>
          )}
        </div>

        <div className="pe-phead-lower">
          <div className="pe-idband">
            <div className="pe-name-row">
              <h1 className={cn("pe-name", card.headingFont)}>{card.name}</h1>
              <VerifiedPill />
            </div>
            {card.designation && <p className="pe-role">{card.designation}</p>}
            {card.company && (
              <p className="pe-company">
                {card.companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.companyLogo} alt="" className="size-4 shrink-0 object-contain" />
                ) : (
                  <Building2 aria-hidden />
                )}
                {card.company}
              </p>
            )}
            {card.website && (
              <a className="pe-web" href={card.website.href} target="_blank" rel="noopener noreferrer">
                <Globe aria-hidden />
                {card.website.value.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          <div className="pe-actions">
            <SaveContactButton
              slug={card.slug}
              variant="unstyled"
              className="pe-btn pe-btn-primary"
              label="Save Contact"
            />
            <ShareButton variant="unstyled" className="pe-btn pe-btn-outline" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function OriginalTheme({ data }: { data: ThemeCardData }) {
  const card = buildCardModel(data);
  const sections = contentSections(card);
  const video = card.videos[0];

  return (
    <div className={cn("pe-stack", card.bodyFont)}>
      <ProfileHead card={card} />

      {card.contacts.length > 0 && (
        <Section title="Get In Touch">
          <div className="pe-cinfo">
            {card.contacts.map((contact) => (
              <a
                key={contact.type}
                className="pe-cinfo-card"
                href={contact.href}
                target={contact.external ? "_blank" : undefined}
                rel={contact.external ? "noopener noreferrer" : undefined}
              >
                <span className="pe-cinfo-ic">
                  <contact.icon aria-hidden />
                </span>
                <span className="pe-cinfo-eyebrow">{contact.label}</span>
                <span className="pe-cinfo-title">{contact.value}</span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {(card.about || card.stats.length > 0 || card.tagline) && (
        <Section title="About">
          {card.about && <p className="pe-about-p">{card.about}</p>}
          {card.stats.length > 0 && (
            <div className="pe-stats">
              {card.stats.map((stat) => (
                <div key={stat.label} className="pe-stat">
                  <div className="pe-stat-num">{stat.value}</div>
                  <div className="pe-stat-cap">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
          {card.tagline && (
            <div className="pe-tags">
              <span className="pe-tag">{card.tagline}</span>
            </div>
          )}
        </Section>
      )}

      {video && (
        <Section title="Watch">
          <VideoBlock url={video.url} caption={video.caption} />
        </Section>
      )}

      {sections.map((section) => (
        <Section key={section.key} title={section.title}>
          {section.node}
        </Section>
      ))}

      {card.textBlocks.length > 0 && (
        <Section title="Details">
          <div className="pe-rows">
            {card.textBlocks.map((block, i) => (
              <div key={i} className="pe-row">
                <div className="pe-row-b">
                  <div className="pe-row-lab">{block.label}</div>
                  <div className="pe-row-val">{block.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {card.payment && (
        <Section title="Payments">
          <div className="pe-pay">
            <div className="pe-pay-info">
              {card.payment.upiId && (
                <>
                  <div className="pe-pay-field">
                    <div>
                      <div className="pe-upi-lab">UPI ID</div>
                      <div className="pe-upi-id">{card.payment.upiId}</div>
                    </div>
                  </div>
                  <a className="pe-pay-btn" href={upiPayHref(card.payment.upiId, card.name)}>
                    <Wallet aria-hidden />
                    Pay via UPI
                  </a>
                </>
              )}
              <SecureNote />
            </div>
            {card.payment.upiQr && (
              <div className="pe-pay-qr">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.payment.upiQr} alt="UPI payment QR code" className="pe-qr" />
                <span className="pe-pay-qr-cap">Scan &amp; Pay</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {card.files.length > 0 && (
        <Section title="Files">
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
        </Section>
      )}

      <Section>
        <ScanBlock slug={card.slug} className="pe-scan" />
      </Section>

      <CardFooter />
    </div>
  );
}
