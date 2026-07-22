
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import priinteveData from "./seed-data/priinteve.json";

const db = new PrismaClient();

async function upsertSetting(key: string, value: string) {
  await db.settings.upsert({
    where: { key },
    update: {},
    create: { key, value },
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueReferralCode(): Promise<string> {
  let code: string;
  let existing;
  do {
    code = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
    existing = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  } while (existing);
  return code;
}

async function resolveSlugFor(email: string, desiredSlug: string): Promise<string> {
  let candidate = desiredSlug;
  let suffix = 1;
  while (true) {
    const owner = await db.user.findUnique({ where: { slug: candidate }, select: { email: true } });
    if (!owner || owner.email === email) return candidate;
    suffix += 1;
    candidate = `${desiredSlug}-${suffix}`;
  }
}

async function seedAdmin(company: string): Promise<string | null> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed.");
    return null;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db.user.findUnique({ where: { email } });

  const name = "Tarang Sachaniya";
  const desiredSlug = slugify(`${name}-${company}`) || "admin";
  const slug = await resolveSlugFor(email, desiredSlug);

  if (existing) {
    const updated = await db.user.update({
      where: { email },
      data: {
        passwordHash,
        role: "ADMIN",
        name,
        company,
        cardPublished: true,
        slug,
      },
    });
    return updated.id;
  }

  const referralCode = await generateUniqueReferralCode();

  const created = await db.user.create({
    data: {
      name,
      email,
      company,
      passwordHash,
      role: "ADMIN",
      slug,
      referralCode,
      cardPublished: true,
    },
  });
  return created.id;
}

async function seedSiteContentFlat(section: string, entries: Record<string, string>) {
  await db.siteContent.createMany({
    data: Object.entries(entries).map(([key, value]) => ({ section, key, value })),
    skipDuplicates: true,
  });
}

async function seedSiteContentList(section: string, items: Record<string, unknown>[]) {
  await db.siteContent.createMany({
    data: items.map((item, index) => ({
      section,
      key: String(index + 1).padStart(2, "0"),
      value: JSON.stringify(item),
    })),
    skipDuplicates: true,
  });
}

async function seedPlan(data: {
  name: string;
  cardType: "NFC" | "QR" | "BOTH";
  price: number;
  validityDays: number;
  featuresJson: string[];
  maxGalleryImages: number;
  recommended?: boolean;
}) {
  const existing = await db.plan.findFirst({ where: { name: data.name } });
  if (existing) return;
  await db.plan.create({ data });
}

const PRIINTEVE_FIELD_TYPES = [
  "company_name",
  "company_tagline",
  "company_description",
  "company_logo",
  "website",
  "email",
  "phone",
  "address",
  "business_hours",
  "designation",
  "bio",
  "photo",
  "service",
  "testimonial",
  "social_linkedin",
  "social_github",
  "social_instagram",
  "social_facebook",
  "social_twitter",
  "social_youtube",
  "whatsapp",
  "google_maps_url",
] as const;

async function seedPriinteveCardFields(userId: string, data: typeof priinteveData) {
  await db.cardField.deleteMany({
    where: { userId, fieldType: { in: [...PRIINTEVE_FIELD_TYPES] } },
  });

  let order = 0;
  const rows: {
    userId: string;
    fieldType: string;
    label: string;
    value: string;
    order: number;
  }[] = [];

  const push = (fieldType: string, label: string, value: string) => {
    rows.push({ userId, fieldType, label, value, order: order++ });
  };

  push("company_name", "Company Name", data.company.name);
  push("company_tagline", "Tagline", data.company.tagline);
  push("company_description", "About Company", data.company.description);
  push("company_logo", "Company Logo", data.company.logo);
  push("website", "Website", data.company.website);
  push("email", "Email", data.company.email);
  push("phone", "Phone", data.company.phone);
  push("address", "Address", data.company.address);
  push("business_hours", "Business Hours", data.company.business_hours);

  push("designation", "Designation", data.owner.designation);
  push("bio", "Bio", data.owner.bio);
  push("photo", "Profile Photo", data.owner.profile_image);

  for (const service of data.services) {
    push(
      "service",
      service.title,
      JSON.stringify({
        slug: service.slug,
        short_description: service.short_description,
        icon: service.icon,
        image: service.image,
      })
    );
  }

  for (const testimonial of data.testimonials) {
    push(
      "testimonial",
      testimonial.client_name,
      JSON.stringify({
        company: testimonial.company,
        designation: testimonial.designation,
        rating: testimonial.rating,
        review: testimonial.review,
      })
    );
  }

  push("social_linkedin", "LinkedIn", data.social_links.linkedin);
  push("social_github", "GitHub", data.social_links.github);
  push("social_instagram", "Instagram", data.social_links.instagram);
  push("social_facebook", "Facebook", data.social_links.facebook);
  push("social_twitter", "X (Twitter)", data.social_links.x);
  push("social_youtube", "YouTube", data.social_links.youtube);
  push("whatsapp", "WhatsApp", data.contact.whatsapp);
  push("google_maps_url", "Google Maps", data.contact.google_maps_url);

  await db.cardField.createMany({ data: rows });
}

async function main() {
  const adminId = await seedAdmin(priinteveData.company.name);
  if (adminId) {
    await seedPriinteveCardFields(adminId, priinteveData);
  }

  await upsertSetting("wallet_conversion_rate", "100");
  await upsertSetting("wallet_min_redeem_points", "500");
  await upsertSetting("referral_points_per_referral", "100");

  await seedPlan({
    name: "Starter",
    cardType: "QR",
    price: 499,
    validityDays: 365,
    featuresJson: ["QR digital card", "Basic profile fields", "5 gallery images"],
    maxGalleryImages: 5,
  });

  await seedPlan({
    name: "Pro",
    cardType: "BOTH",
    price: 999,
    validityDays: 365,
    featuresJson: [
      "NFC + QR digital card",
      "Full profile customization",
      "20 gallery images",
      "Priority support",
    ],
    maxGalleryImages: 20,
    recommended: true,
  });

  await seedPlan({
    name: "NFC Only",
    cardType: "NFC",
    price: 799,
    validityDays: 365,
    featuresJson: ["NFC digital card", "Full profile customization", "10 gallery images"],
    maxGalleryImages: 10,
  });

  await seedSiteContentFlat("homepage_hero", {
    headline: "One card. Every way to connect.",
    subheadline:
      "Share your contact details, socials, and portfolio with a single tap or scan — no app required.",
    cta_label: "Get Your Card",
    social_proof: "Trusted by thousands of professionals to make lasting first impressions.",
  });

  await seedSiteContentFlat("how_it_works", {
    "1": "Sign up and choose a plan that fits how you network.",
    "2": "Build your card: add your details, links, and gallery with our guided setup.",
    "3": "Share it by tapping your NFC card or scanning your QR code — anywhere, instantly.",
  });

  await seedSiteContentFlat("faq", {
    "What is a digital business card?":
      "A shareable online profile with your contact details, links, and gallery — accessible via NFC tap or QR scan.",
    "Do I need an app to use it?":
      "No. Recipients just tap your NFC card or scan the QR code with their phone's camera.",
    "Can I update my card after publishing?":
      "Yes, changes to your card are reflected instantly for anyone who visits your link.",
    "How long does my card stay active?":
      "Each plan comes with a validity period shown on the pricing page — you'll get a reminder before it expires.",
    "Can I switch plans later?":
      "Yes, you can upgrade at any time from your dashboard and the new features apply immediately.",
  });

  // Placeholder starter content — replace via /admin/content once real
  // client names, testimonials, and a demo video are available.
  await seedSiteContentList("homepage_logos", [
    { name: "Northwind Traders" },
    { name: "Fenwick & Co" },
    { name: "Solace Studio" },
    { name: "Alto Group" },
    { name: "Marrow Labs" },
    { name: "Vantage Partners" },
  ]);

  await seedSiteContentList("homepage_templates", [
    {
      industry: "Real Estate",
      description: "Showcase listings, virtual tours, and instant contact for every open house.",
      accent: "emerald",
    },
    {
      industry: "Freelance & Consulting",
      description: "Share your portfolio, services, and booking link the moment you meet a client.",
      accent: "violet",
    },
    {
      industry: "Healthcare & Clinics",
      description: "Give patients your clinic hours, location, and booking details in one tap.",
      accent: "blue",
    },
    {
      industry: "Retail & Hospitality",
      description: "Point customers to your menu, offers, and socials without a single reprint.",
      accent: "amber",
    },
    {
      industry: "Corporate Sales Teams",
      description: "Keep every rep's card consistent, on-brand, and instantly updatable.",
      accent: "slate",
    },
    {
      industry: "Creators & Coaches",
      description: "Link your content, programs, and payment details from one shareable profile.",
      accent: "rose",
    },
  ]);

  await seedSiteContentFlat("homepage_video", {
    heading: "See a card built, tapped, and updated.",
    caption: "A two-minute walkthrough of building a profile, ordering a card, and sharing it live.",
    duration_label: "1:24",
  });

  await seedSiteContentList("homepage_testimonials", [
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
    {
      name: "Priya Nair",
      role: "Independent Consultant",
      quote: "Tap-to-share has genuinely changed how fast I follow up with new contacts.",
      rating: 4,
    },
  ]);

  await seedSiteContentList("homepage_features", [
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
  ]);

  await seedSiteContentFlat("homepage_card_preview", {
    eyebrow: "Live demo",
    heading: "Your whole business, behind one profile.",
    description:
      "Photo, title, company, and every way to reach you — all live behind a single link that updates the moment you do.",
    cta_label: "Preview your card",
  });

  await seedSiteContentList("homepage_comparison", [
    { label: "Cost per share" },
    { label: "Updates after printing" },
    { label: "Analytics" },
    { label: "Eco-friendly" },
    { label: "Works when your phone is dead" },
    { label: "Shares full profile — links, video, PDF" },
    { label: "Lead capture" },
  ]);

  await seedSiteContentFlat("homepage_contact", {
    eyebrow: "Contact",
    heading: "Still have questions?",
    description: "Send us a message and our team will get back to you within one business day.",
    email: "hello@tapcard.co",
  });

  await seedSiteContentFlat("homepage_closing_cta", {
    heading: "Get your card and start sharing in style.",
    description: "Free shipping on every order. Cards typically arrive within a week.",
    cta_label: "Get your card",
  });

  await seedSiteContentFlat("homepage_footer", {
    tagline: "The last business card you'll ever need — one tap, every way to connect.",
    twitter_url: "https://twitter.com",
    instagram_url: "https://instagram.com",
    linkedin_url: "https://linkedin.com",
  });

  await seedSiteContentFlat("homepage_navbar", {
    brand_name: "Tapcard",
    login_label: "Log in",
    cta_label: "Get your card",
    nav_features: "Features",
    nav_how_it_works: "How it works",
    nav_pricing: "Pricing",
    nav_faq: "FAQ",
    nav_contact: "Contact",
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
