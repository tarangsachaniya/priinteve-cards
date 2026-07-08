import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { passwordResetEmailHtml } from "@/lib/email-templates";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const GENERIC_RESPONSE = {
  success: true,
  message: "If that email exists, a reset link has been sent.",
};

export async function POST(req: Request) {
  const parsed = forgotPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: passwordResetEmailHtml({ resetUrl }),
    }).catch((err) => console.error("reset email failed", err));
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
