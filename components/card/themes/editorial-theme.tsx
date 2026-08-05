"use client";

import { ArrowUpRight, ChevronRight, Download, Wallet } from "lucide-react";

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
 * 1c — "Editorial: magazine spotlight" (PrintEve/printeve-card-options-web.html).
 *
 * A circular spotlight portrait under a soft brand glow, a display-serif name,
 * numbered section markers and a floating action dock. Desktop moves the
 * profile into a sticky left column.
 */

/** Numbered section marker — the signature of this theme. */
function Mark({ index, label }: { index: number; label: string }) {
  return (
    <div className="pe-mark">
      <span className="pe-no" aria-hidden>
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="pe-lb">{label}</h2>
    </div>
  );
}

function Spotlight({ card }: { card: CardModel }) {
  return (
    <header className="pe-hero">
      <span className="pe-glow" aria-hidden />
      <div className="pe-portrait">
        {card.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photo} alt={card.name} />
        ) : (
          <span className="pe-initial">{initialOf(card.name)}</span>
        )}
      </div>
      <div className="pe-vpill">
        <VerifiedPill />
      </div>
      <h1 className={cn("pe-name", card.headingFont)}>{card.name}</h1>
      {card.designation && <p className="pe-role">{card.designation}</p>}
      {card.company && (
        <p className="pe-company">
          <span className="pe-bar" aria-hidden />
          {card.company}
        </p>
      )}
      {card.tagline && <p className="pe-tagline">{card.tagline}</p>}
      {card.website && (
        <a className="pe-cat" href={card.website.href} target="_blank" rel="noopener noreferrer">
          {card.website.value.replace(/^https?:\/\//, "")}
        </a>
      )}
    </header>
  );
}

export function EditorialTheme({ data }: { data: ThemeCardData }) {
  const card = buildCardModel(data);
  const sections = contentSections(card, true);
  const video = card.videos[0];

  // Section markers are numbered in render order, so the numbering stays
  // continuous whatever combination of sections a given card actually has.
  let markIndex = 0;
  const nextMark = () => ++markIndex;

  return (
    // A Fragment, not a wrapping <div>: .pe-side and .pe-main must be direct
    // children of .pe-ed (the CSS Grid container) for the desktop two-column
    // reflow to place them in separate tracks — an extra element here (e.g. to
    // carry card.bodyFont) would become the sole grid item instead, collapsing
    // both columns into one. bodyFont is applied to .pe-main directly below,
    // since that's where the actual body copy (About, testimonials, FAQ…) lives.
    <>
      <div className="pe-side">
        <Spotlight card={card} />

        <div className="pe-dock">
          <div className="pe-drow">
            <SaveContactButton
              slug={card.slug}
              variant="unstyled"
              className="pe-btn pe-save"
              label="Save Contact"
            />
            <ShareButton variant="unstyled" className="pe-btn pe-vcard" label="" />
          </div>
        </div>
      </div>

      <div className={cn("pe-main", card.bodyFont)}>
        {card.contacts.length > 0 && (
          <section className="pe-sec pe-pad">
            <Mark index={nextMark()} label="Get In Touch" />
            <div className="pe-clist">
              {card.contacts.map((contact) => (
                <a
                  key={contact.type}
                  className="pe-crow"
                  href={contact.href}
                  target={contact.external ? "_blank" : undefined}
                  rel={contact.external ? "noopener noreferrer" : undefined}
                >
                  <span className="pe-cicon">
                    <contact.icon aria-hidden />
                  </span>
                  <span className="pe-cbody">
                    <span className="pe-clab">{contact.label}</span>
                    <span className="pe-cval">{contact.value}</span>
                  </span>
                  <span className="pe-carr">
                    <ChevronRight aria-hidden />
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(card.about || card.stats.length > 0) && (
          <section className="pe-sec pe-pad">
            <Mark index={nextMark()} label="About" />
            <div className="pe-about">{card.about && <p>{card.about}</p>}</div>
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
          </section>
        )}

        {video && (
          <section className="pe-sec pe-pad">
            <Mark index={nextMark()} label="Watch" />
            <VideoBlock url={video.url} caption={video.caption} />
          </section>
        )}

        {sections.map((section) => (
          <section key={section.key} className="pe-sec pe-pad">
            <Mark index={nextMark()} label={section.title} />
            {section.node}
          </section>
        ))}

        {card.textBlocks.length > 0 && (
          <section className="pe-sec pe-pad">
            <Mark index={nextMark()} label="Details" />
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
          </section>
        )}

        {card.payment && (
          <section className="pe-sec pe-pad">
            <Mark index={nextMark()} label="Payments" />
            <div className="pe-pay">
              <div className="pe-upi">
                <div className="pe-upi-b">
                  {card.payment.upiId && (
                    <>
                      <div className="pe-upi-lab">UPI ID</div>
                      <div className="pe-upi-id">{card.payment.upiId}</div>
                    </>
                  )}
                </div>
                {card.payment.upiQr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.payment.upiQr} alt="UPI payment QR code" className="pe-qr" />
                )}
              </div>
              {card.payment.upiId && (
                <div className="pe-payrow">
                  <a className="pe-pay-btn" href={upiPayHref(card.payment.upiId, card.name)}>
                    <Wallet aria-hidden />
                    Pay via UPI
                  </a>
                </div>
              )}
              <SecureNote />
            </div>
          </section>
        )}

        {card.files.length > 0 && (
          <section className="pe-sec pe-pad">
            <Mark index={nextMark()} label="Files" />
            <div className="pe-rows">
              {card.files.map((file, i) => (
                <a
                  key={i}
                  className="pe-row pe-row-file"
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
          </section>
        )}

        <section className="pe-sec pe-pad">
          <ScanBlock slug={card.slug} className="pe-scan" />
        </section>

        <div className="pe-pad">
          <CardFooter />
        </div>
      </div>
    </>
  );
}
