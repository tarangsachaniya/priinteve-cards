import { Globe, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";

import { mailtoHref, telHref, waHref } from "@/lib/contact-links";
import { getYoutubeVideoId } from "@/lib/youtube";
import { DEFAULT_BRAND_COLOR } from "@/lib/card-theme";
import type {
  ButtonItem,
  FaqItem,
  ProductItem,
  ServiceItem,
  SocialLink,
  TestimonialItem,
} from "@/lib/card-sections";
import type { BusinessHoursValue } from "@/lib/validations/card-field";
import type { ThemeCardData, ThemeCardField, ThemeCardGallery } from "@/components/card/theme-card";

/**
 * Normalises a card's flat CardField list into one shape all three themes
 * render from. The themes stay purely presentational, and a field-type change
 * is a one-file edit rather than three.
 */

export type CardContact = {
  type: string;
  label: string;
  value: string;
  href: string;
  external: boolean;
  icon: LucideIcon;
};

export type CardStat = { label: string; value: string };
export type CardFile = { label: string; url: string };
export type CardTextBlock = { label: string; body: string };
export type CardHours = { label: string; hours: BusinessHoursValue };
export type CardPayment = { upiId: string; upiQr: string };

export type CardModel = {
  name: string;
  slug: string;
  photo: string;
  coverImage: string;
  designation: string;
  company: string;
  companyLogo: string;
  tagline: string;
  about: string;
  brandColor: string;
  headingFont?: string;
  bodyFont?: string;
  contacts: CardContact[];
  website: CardContact | null;
  socials: SocialLink[];
  stats: CardStat[];
  services: ServiceItem[];
  products: ProductItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  buttons: ButtonItem[];
  images: ThemeCardGallery[];
  videos: ThemeCardGallery[];
  files: CardFile[];
  textBlocks: CardTextBlock[];
  businessHours: CardHours[];
  customHtml: string[];
  payment: CardPayment | null;
};

/** Contact types, in the order the reference lays them out. */
const CONTACT_META: Record<string, { label: string; icon: LucideIcon }> = {
  phone: { label: "Call Us On", icon: Phone },
  whatsapp: { label: "Chat With Us", icon: MessageCircle },
  email: { label: "Drop A Line", icon: Mail },
  address: { label: "Mail Address", icon: MapPin },
  google_maps_url: { label: "Location", icon: MapPin },
};
const CONTACT_ORDER = ["phone", "whatsapp", "email", "address", "google_maps_url"];

/**
 * Preferred display order; any other `social_*` field (github, etc.) still
 * renders, appended after these. Derived from the field type rather than a
 * fixed list so a newly supported platform shows up without a code change —
 * matching how groupTypeFor() in lib/card-sections.ts classifies them.
 */
const SOCIAL_ORDER = [
  "social_linkedin",
  "social_instagram",
  "social_twitter",
  "social_facebook",
  "social_youtube",
  "social_github",
];

function get(fields: ThemeCardField[], type: string): string {
  return fields.find((field) => field.fieldType === type)?.value || "";
}

function safeParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Every repeatable "group" section is stored as one CardField per item — label
 * holds the item's title/name, value holds the rest as JSON. Invalid rows are
 * skipped rather than breaking the whole card.
 */
function groupItems<T>(fields: ThemeCardField[], fieldType: string, titleKey: string): T[] {
  return fields
    .filter((field) => field.fieldType === fieldType)
    .map((field) => {
      const parsed = safeParse<Record<string, unknown>>(field.value);
      return parsed ? ({ [titleKey]: field.label, ...parsed } as T) : null;
    })
    .filter((item): item is T => item !== null);
}

function contactHref(type: string, value: string): string {
  if (type === "email") return mailtoHref(value);
  if (type === "phone") return telHref(value);
  if (type === "whatsapp") return waHref(value);
  if (type === "address") return `https://maps.google.com/?q=${encodeURIComponent(value)}`;
  return value;
}

export function buildCardModel(data: ThemeCardData): CardModel {
  const fields = data.fields.filter((field) => field.isVisible !== false);

  const contacts: CardContact[] = CONTACT_ORDER.map((type) => {
    const value = get(fields, type);
    if (!value) return null;
    const meta = CONTACT_META[type];
    return {
      type,
      label: meta.label,
      value,
      href: contactHref(type, value),
      external: type === "address" || type === "google_maps_url",
      icon: meta.icon,
    };
  }).filter((contact): contact is CardContact => contact !== null);

  const websiteValue = get(fields, "website");
  const website: CardContact | null = websiteValue
    ? {
        type: "website",
        label: "Website",
        value: websiteValue,
        href: websiteValue,
        external: true,
        icon: Globe,
      }
    : null;

  const socials: SocialLink[] = fields
    .filter((field) => field.fieldType.startsWith("social_") && field.value)
    .sort((a, b) => {
      const rank = (type: string) => {
        const i = SOCIAL_ORDER.indexOf(type);
        return i === -1 ? SOCIAL_ORDER.length : i;
      };
      return rank(a.fieldType) - rank(b.fieldType);
    })
    .map((field) => ({ platform: field.fieldType.replace("social_", ""), url: field.value }));

  const stats: CardStat[] = fields
    .filter((field) => field.fieldType === "stat")
    .map((field) => {
      const parsed = safeParse<{ value?: string }>(field.value);
      return { label: field.label, value: parsed?.value ?? field.value };
    });

  const files: CardFile[] = fields
    .filter((field) => field.fieldType === "file" && field.value)
    .map((field) => ({ label: field.label || "Download", url: field.value }));

  const freeTextBlocks: CardTextBlock[] = fields
    .filter((field) => field.fieldType === "text" && field.value)
    .map((field) => ({ label: field.label, body: field.value }));

  // business_hours is normally the structured JSON the builder writes, but some
  // cards carry a plain string ("Mon - Sat: 10-7"). Render whichever it is
  // rather than silently dropping the field.
  const hoursFields = fields.filter((field) => field.fieldType === "business_hours" && field.value);
  const businessHours: CardHours[] = [];
  const businessHoursText: CardTextBlock[] = [];
  for (const field of hoursFields) {
    const parsed = safeParse<BusinessHoursValue>(field.value);
    if (parsed && typeof parsed === "object" && "mon" in parsed) {
      businessHours.push({ label: field.label || "Business hours", hours: parsed });
    } else {
      businessHoursText.push({ label: field.label || "Business hours", body: field.value });
    }
  }

  const customHtml = fields
    .filter((field) => field.fieldType === "custom_html" && field.value)
    .map((field) => field.value);

  const upiId = get(fields, "upi_id");
  const upiQr = get(fields, "upi_qr");

  const gallery = data.galleryItems ?? [];

  return {
    name: data.name,
    slug: data.slug,
    photo: get(fields, "photo"),
    coverImage: get(fields, "cover_image"),
    designation: get(fields, "designation"),
    company: get(fields, "company_name"),
    companyLogo: get(fields, "company_logo"),
    tagline: get(fields, "company_tagline"),
    // "bio" is the personal about; company_description is the business one.
    // The reference shows a single About block, so prefer the personal bio and
    // fall back to the company description.
    about: get(fields, "bio") || get(fields, "company_description"),
    brandColor: data.settings.brandColor || DEFAULT_BRAND_COLOR,
    headingFont: data.settings.headingFont,
    bodyFont: data.settings.bodyFont,
    contacts,
    website,
    socials,
    stats,
    services: groupItems<ServiceItem>(fields, "service", "title"),
    products: groupItems<ProductItem>(fields, "product", "title"),
    testimonials: groupItems<TestimonialItem>(fields, "testimonial", "client_name"),
    faqs: groupItems<FaqItem>(fields, "faq", "question"),
    buttons: groupItems<ButtonItem>(fields, "button", "label"),
    images: gallery.filter((item) => item.type === "IMAGE"),
    videos: gallery.filter((item) => item.type === "YOUTUBE" && getYoutubeVideoId(item.url)),
    files,
    // Plain-string business hours join the Details rows, where a label/value
    // pair is exactly the right shape for them.
    textBlocks: [...freeTextBlocks, ...businessHoursText],
    businessHours,
    customHtml,
    payment: upiId || upiQr ? { upiId, upiQr } : null,
  };
}

export function upiPayHref(upiId: string, name: string): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR`;
}

/** The scan-to-open QR, served by the existing /api/qr/[slug]/png route. */
export function cardQrSrc(slug: string): string {
  return `/api/qr/${slug}/png`;
}

export function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}
