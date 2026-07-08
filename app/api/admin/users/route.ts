import { randomBytes } from "crypto";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { welcomeEmailHtml } from "@/lib/email-templates";
import { generateUniqueReferralCode, generateUniqueSlug } from "@/lib/slug";
import { createUserSchema } from "@/lib/validations/admin";

const SORTABLE_FIELDS = new Set(["name", "email", "planExpiresAt", "createdAt"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const search = searchParams.get("search")?.trim() ?? "";
  const sortByParam = searchParams.get("sortBy") ?? "createdAt";
  const sortBy = SORTABLE_FIELDS.has(sortByParam) ? sortByParam : "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        planExpiresAt: true,
        plan: { select: { name: true } },
      },
    }),
  ]);

  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const [cardViews, referralsMade] = await Promise.all([
        db.cardView.count({ where: { userId: user.id } }),
        db.referral.count({ where: { referrerId: user.id } }),
      ]);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        planName: user.plan?.name ?? null,
        planExpiresAt: user.planExpiresAt,
        cardViews,
        referralsMade,
      };
    })
  );

  return NextResponse.json({ users: usersWithStats, total, page, limit });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, role, planId, planExpiresAt } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const slug = await generateUniqueSlug(name);
  const referralCode = await generateUniqueReferralCode();

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      slug,
      referralCode,
      role,
      planId,
      planExpiresAt,
      cardPublished: false,
    },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  const setPasswordUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Welcome to Digital Business Card",
    html: welcomeEmailHtml({ name: user.name ?? "there", setPasswordUrl }),
  }).catch((err) => console.error("welcome email failed", err));

  return NextResponse.json(
    { success: true, user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 }
  );
}
