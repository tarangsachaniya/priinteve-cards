
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

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

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({
      where: { email },
      data: { passwordHash, role: "ADMIN" },
    });
    return;
  }

  const slug = slugify(email.split("@")[0]) || "admin";
  const referralCode = await generateUniqueReferralCode();

  await db.user.create({
    data: {
      name: "Admin",
      email,
      passwordHash,
      role: "ADMIN",
      slug,
      referralCode,
      cardPublished: false,
    },
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

async function main() {
  await seedAdmin();

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
