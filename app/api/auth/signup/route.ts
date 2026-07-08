import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { issueSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { welcomeEmailHtml } from "@/lib/email-templates";
import { createPendingReferralIfPresent } from "@/lib/referral";
import { generateUniqueReferralCode, generateUniqueSlug } from "@/lib/slug";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  const parsed = signupSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, company } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = await generateUniqueSlug(name, company);
  const referralCode = await generateUniqueReferralCode();

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      slug,
      referralCode,
      role: "USER",
      cardPublished: false,
    },
  });

  await createPendingReferralIfPresent(user.id);
  await issueSessionCookie(user);

  await sendEmail({
    to: user.email,
    subject: "Welcome to Digital Business Card",
    html: welcomeEmailHtml({ name: user.name ?? "there" }),
  }).catch((err) => console.error("welcome email failed", err));

  return NextResponse.json({ success: true, email: user.email });
}
