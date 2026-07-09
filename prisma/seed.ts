
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

async function seedAdmin(): Promise<string | null> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed.");
    return null;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db.user.findUnique({ where: { email } });

  const preferredSlug = "priinteve-innovations";
  const slugOwner = await db.user.findUnique({ where: { slug: preferredSlug } });
  const slugAvailable = !slugOwner || slugOwner.email === email;

  if (existing) {
    const updated = await db.user.update({
      where: { email },
      data: {
        passwordHash,
        role: "ADMIN",
        name: "Tarang Sachaniya",
        cardPublished: true,
        ...(slugAvailable ? { slug: preferredSlug } : {}),
      },
    });
    return updated.id;
  }

  const slug = slugAvailable ? preferredSlug : slugify(email.split("@")[0]) || "admin";
  const referralCode = await generateUniqueReferralCode();

  const created = await db.user.create({
    data: {
      name: "Tarang Sachaniya",
      email,
      passwordHash,
      role: "ADMIN",
      slug,
      referralCode,
      cardPublished: true,
    },
  });
  return created.id;
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
  const adminId = await seedAdmin();
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
