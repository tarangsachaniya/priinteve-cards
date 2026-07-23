import { db } from "@/lib/db";
import type {
  HomepageComparisonRowInput,
  HomepageFeatureInput,
  HomepageLogoInput,
  HomepageTemplateInput,
  HomepageTestimonialInput,
} from "@/lib/validations/admin";

export async function getSiteContentMap(section: string): Promise<Record<string, string>> {
  const rows = await db.siteContent.findMany({ where: { section }, orderBy: { key: "asc" } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getSiteContentEntries(section: string) {
  return db.siteContent.findMany({ where: { section }, orderBy: { key: "asc" } });
}

export async function getSiteContentList<T>(section: string): Promise<T[]> {
  const rows = await getSiteContentEntries(section);
  const items: T[] = [];
  for (const row of rows) {
    try {
      items.push(JSON.parse(row.value) as T);
    } catch {
      // Skip malformed rows rather than failing the whole page render.
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Typed homepage getters. Each one falls back to hand-written defaults when
// the admin hasn't populated (or has cleared) the underlying SiteContent
// rows, so the marketing page never renders empty/broken sections.
// ---------------------------------------------------------------------------

export type HomepageHero = {
  headline: string;
  subheadline: string;
  ctaLabel: string;
  socialProof: string;
};

const DEFAULT_HERO: HomepageHero = {
  headline: "The last business card you'll ever need.",
  subheadline:
    "Tap your card and instantly share your contact details, socials, and portfolio — no app required for the person on the other end.",
  ctaLabel: "Get your card",
  socialProof: "Trusted by thousands of professionals to make lasting first impressions.",
};

export async function getHomepageHero(): Promise<HomepageHero> {
  const map = await getSiteContentMap("homepage_hero");
  return {
    headline: map.headline || DEFAULT_HERO.headline,
    subheadline: map.subheadline || DEFAULT_HERO.subheadline,
    ctaLabel: map.cta_label || DEFAULT_HERO.ctaLabel,
    socialProof: map.social_proof || DEFAULT_HERO.socialProof,
  };
}

export type HowItWorksStep = { number: string; title: string; description: string };

const DEFAULT_STEPS: HowItWorksStep[] = [
  { number: "01", title: "Sign up", description: "Create your account and pick a plan that fits how you network." },
  { number: "02", title: "Build your card", description: "Add your details, links, and branding to your profile." },
  { number: "03", title: "Share it", description: "Tap, scan, or send your card to anyone, anywhere." },
];

export async function getHowItWorksSteps(): Promise<HowItWorksStep[]> {
  const map = await getSiteContentMap("how_it_works");
  return DEFAULT_STEPS.map((step, index) => ({
    ...step,
    description: map[String(index + 1)] || step.description,
  }));
}

export type FaqItem = { question: string; answer: string };

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "How does the NFC tap actually work?",
    answer:
      "Your card has a small NFC chip embedded in it. When someone holds their phone near it, their phone reads the chip and opens your profile in their browser — no app, no Bluetooth pairing, nothing to install.",
  },
  {
    question: "Will it work with my phone?",
    answer:
      "Any iPhone from the XS onward and virtually every Android phone from the last six years supports NFC out of the box. Every card also ships with a QR code as a backup for older devices.",
  },
  {
    question: "Can I edit my card after it's printed?",
    answer:
      "Yes — the card itself never changes, it just points to your live profile. Edit your details, links, or photo anytime in your dashboard and everyone who's already tapped your card sees the update instantly.",
  },
  {
    question: "Do you offer team or bulk orders?",
    answer:
      "Yes. Our top plans include a team dashboard for managing every teammate's card, enforcing brand consistency, and ordering in bulk at a discount.",
  },
  {
    question: "What happens to the data I collect?",
    answer:
      "Any contact details captured through your card belong to you. We never sell or share your data or your leads' data with third parties — see our privacy policy for the full details.",
  },
];

export async function getFaqItems(): Promise<FaqItem[]> {
  const entries = await getSiteContentEntries("faq");
  if (entries.length === 0) return DEFAULT_FAQS;
  return entries.map((entry) => ({ question: entry.key, answer: entry.value }));
}

const DEFAULT_LOGOS: HomepageLogoInput[] = [
  { name: "Northwind Traders" },
  { name: "Fenwick & Co" },
  { name: "Solace Studio" },
  { name: "Alto Group" },
  { name: "Marrow Labs" },
  { name: "Vantage Partners" },
];

export async function getHomepageLogos(): Promise<HomepageLogoInput[]> {
  const items = await getSiteContentList<HomepageLogoInput>("homepage_logos");
  return items.length ? items : DEFAULT_LOGOS;
}

const DEFAULT_TEMPLATES: HomepageTemplateInput[] = [
  {
    industry: "Real Estate",
    description: "Listings, virtual tours, and instant contact for every open house.",
    accent: "emerald",
  },
  {
    industry: "Sales",
    description: "One tap hands over your calendar link, deck, and direct line.",
    accent: "slate",
  },
  {
    industry: "Freelancers & Creators",
    description: "Portfolio, socials, and booking link the moment you meet a client.",
    accent: "violet",
  },
  {
    industry: "Healthcare",
    description: "Clinic hours, location, and booking details in one calm profile.",
    accent: "blue",
  },
  {
    industry: "Restaurants",
    description: "Menu, reservations, and reviews without a single reprint.",
    accent: "amber",
  },
  {
    industry: "Events",
    description: "Swap contact info with a hundred people without running out of cards.",
    accent: "rose",
  },
];

export async function getHomepageTemplates(): Promise<HomepageTemplateInput[]> {
  const items = await getSiteContentList<HomepageTemplateInput>("homepage_templates");
  return items.length ? items : DEFAULT_TEMPLATES;
}

const DEFAULT_TESTIMONIALS: HomepageTestimonialInput[] = [
  {
    name: "Tom Griffith",
    role: "Founder, Growth Collective",
    quote:
      "I used to hand out twenty cards a week and reprint every time I changed roles. Now I tap my Tapcard and people have my whole profile before I've finished the handshake.",
    rating: 5,
  },
  {
    name: "Ananya Rao",
    role: "Founder, Studio Loom",
    quote: "Switched my whole team to digital cards in an afternoon — no more reprint orders.",
    rating: 5,
  },
  {
    name: "Marcus Chen",
    role: "Account Executive",
    quote: "I update my card between meetings and everyone I've shared it with sees it instantly.",
    rating: 5,
  },
];

export async function getHomepageTestimonials(): Promise<HomepageTestimonialInput[]> {
  const items = await getSiteContentList<HomepageTestimonialInput>("homepage_testimonials");
  return items.length ? items : DEFAULT_TESTIMONIALS;
}

export type HomepageVideo = {
  heading: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationLabel: string;
};

const DEFAULT_VIDEO: HomepageVideo = {
  heading: "See a card built, tapped, and updated.",
  caption: "A two-minute walkthrough of building a profile, ordering a card, and sharing it live.",
  videoUrl: "",
  thumbnailUrl: "",
  durationLabel: "1:24",
};

export async function getHomepageVideo(): Promise<HomepageVideo> {
  const map = await getSiteContentMap("homepage_video");
  return {
    heading: map.heading || DEFAULT_VIDEO.heading,
    caption: map.caption || DEFAULT_VIDEO.caption,
    videoUrl: map.video_url || DEFAULT_VIDEO.videoUrl,
    thumbnailUrl: map.thumbnail_url || DEFAULT_VIDEO.thumbnailUrl,
    durationLabel: map.duration_label || DEFAULT_VIDEO.durationLabel,
  };
}

const DEFAULT_FEATURES: HomepageFeatureInput[] = [
  {
    icon: "zap",
    label: "Instant sharing",
    title: "Live in under a second.",
    description: "Tap, scan, or send — your profile opens instantly, on any phone.",
    bullets: [
      "Works with any NFC-enabled phone, no app required",
      "Every card ships with a QR code as a backup",
      "Opens directly in the browser, no install",
    ].join("\n"),
  },
  {
    icon: "user-circle",
    label: "Custom profile",
    title: "Unmistakably you.",
    description: "Brand your profile with your colors, photo, and links.",
    bullets: [
      "Match your brand colors, logo, and photo",
      "Add unlimited links and social profiles",
      "Update anytime — everyone sees the latest version",
    ].join("\n"),
  },
  {
    icon: "target",
    label: "Lead capture",
    title: "Every tap, a saved contact.",
    description: "Turn a handshake into a lead, automatically.",
    bullets: [
      "Recipients save your info in one tap",
      "Collect their details back with an opt-in form",
      "Export captured leads anytime",
    ].join("\n"),
  },
  {
    icon: "bar-chart-3",
    label: "Analytics",
    title: "Know what's working.",
    description: "See exactly who's engaging with your card and when.",
    bullets: [
      "Track taps, scans, and profile views",
      "See which links get clicked most",
      "Daily and weekly summaries",
    ].join("\n"),
  },
  {
    icon: "users",
    label: "Team management",
    title: "Every rep, on-brand.",
    description: "Keep every teammate's card consistent and up to date.",
    bullets: [
      "Manage every teammate's card from one dashboard",
      "Enforce brand colors and templates",
      "Deactivate a card instantly when someone leaves",
    ].join("\n"),
  },
];

export async function getHomepageFeatures(): Promise<HomepageFeatureInput[]> {
  const items = await getSiteContentList<HomepageFeatureInput>("homepage_features");
  return items.length ? items : DEFAULT_FEATURES;
}

export type HomepageCardPreview = {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
};

const DEFAULT_CARD_PREVIEW: HomepageCardPreview = {
  eyebrow: "Live demo",
  heading: "Your whole business, behind one profile.",
  description:
    "Photo, title, company, and every way to reach you — all live behind a single link that updates the moment you do.",
  ctaLabel: "Preview your card",
};

export async function getHomepageCardPreview(): Promise<HomepageCardPreview> {
  const map = await getSiteContentMap("homepage_card_preview");
  return {
    eyebrow: map.eyebrow || DEFAULT_CARD_PREVIEW.eyebrow,
    heading: map.heading || DEFAULT_CARD_PREVIEW.heading,
    description: map.description || DEFAULT_CARD_PREVIEW.description,
    ctaLabel: map.cta_label || DEFAULT_CARD_PREVIEW.ctaLabel,
  };
}

const DEFAULT_COMPARISON_ROWS: HomepageComparisonRowInput[] = [
  { label: "Cost per share" },
  { label: "Updates after printing" },
  { label: "Analytics" },
  { label: "Eco-friendly" },
  { label: "Works when your phone is dead" },
  { label: "Shares full profile — links, video, PDF" },
  { label: "Lead capture" },
];

export async function getHomepageComparisonRows(): Promise<HomepageComparisonRowInput[]> {
  const items = await getSiteContentList<HomepageComparisonRowInput>("homepage_comparison");
  return items.length ? items : DEFAULT_COMPARISON_ROWS;
}

export type HomepageContact = {
  eyebrow: string;
  heading: string;
  description: string;
  email: string;
};

const DEFAULT_CONTACT: HomepageContact = {
  eyebrow: "Contact",
  heading: "Still have questions?",
  description: "Send us a message and our team will get back to you within one business day.",
  email: "hello@tapcard.co",
};

export async function getHomepageContact(): Promise<HomepageContact> {
  const map = await getSiteContentMap("homepage_contact");
  return {
    eyebrow: map.eyebrow || DEFAULT_CONTACT.eyebrow,
    heading: map.heading || DEFAULT_CONTACT.heading,
    description: map.description || DEFAULT_CONTACT.description,
    email: map.email || DEFAULT_CONTACT.email,
  };
}

export type HomepageClosingCta = {
  heading: string;
  description: string;
  ctaLabel: string;
};

const DEFAULT_CLOSING_CTA: HomepageClosingCta = {
  heading: "Get your card and start sharing in style.",
  description: "Free shipping on every order. Cards typically arrive within a week.",
  ctaLabel: "Get your card",
};

export async function getHomepageClosingCta(): Promise<HomepageClosingCta> {
  const map = await getSiteContentMap("homepage_closing_cta");
  return {
    heading: map.heading || DEFAULT_CLOSING_CTA.heading,
    description: map.description || DEFAULT_CLOSING_CTA.description,
    ctaLabel: map.cta_label || DEFAULT_CLOSING_CTA.ctaLabel,
  };
}

export type HomepageFooter = {
  tagline: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
};

const DEFAULT_FOOTER: HomepageFooter = {
  tagline: "The last business card you'll ever need — one tap, every way to connect.",
  twitterUrl: "https://twitter.com",
  instagramUrl: "https://instagram.com",
  linkedinUrl: "https://linkedin.com",
};

export async function getHomepageFooter(): Promise<HomepageFooter> {
  const map = await getSiteContentMap("homepage_footer");
  return {
    tagline: map.tagline || DEFAULT_FOOTER.tagline,
    twitterUrl: map.twitter_url || DEFAULT_FOOTER.twitterUrl,
    instagramUrl: map.instagram_url || DEFAULT_FOOTER.instagramUrl,
    linkedinUrl: map.linkedin_url || DEFAULT_FOOTER.linkedinUrl,
  };
}

export type HomepageNavbar = {
  brandName: string;
  loginLabel: string;
  ctaLabel: string;
  navFeatures: string;
  navHowItWorks: string;
  navPricing: string;
  navFaq: string;
  navContact: string;
};

const DEFAULT_NAVBAR: HomepageNavbar = {
  brandName: "Tapcard",
  loginLabel: "Log in",
  ctaLabel: "Get your card",
  navFeatures: "Features",
  navHowItWorks: "How it works",
  navPricing: "Pricing",
  navFaq: "FAQ",
  navContact: "Contact",
};

export async function getHomepageNavbar(): Promise<HomepageNavbar> {
  const map = await getSiteContentMap("homepage_navbar");
  return {
    brandName: map.brand_name || DEFAULT_NAVBAR.brandName,
    loginLabel: map.login_label || DEFAULT_NAVBAR.loginLabel,
    ctaLabel: map.cta_label || DEFAULT_NAVBAR.ctaLabel,
    navFeatures: map.nav_features || DEFAULT_NAVBAR.navFeatures,
    navHowItWorks: map.nav_how_it_works || DEFAULT_NAVBAR.navHowItWorks,
    navPricing: map.nav_pricing || DEFAULT_NAVBAR.navPricing,
    navFaq: map.nav_faq || DEFAULT_NAVBAR.navFaq,
    navContact: map.nav_contact || DEFAULT_NAVBAR.navContact,
  };
}
