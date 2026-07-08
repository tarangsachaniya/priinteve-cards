import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";
import { contactSchema } from "@/lib/validations/contact";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  const parsed = contactSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  await sendEmail({
    to: process.env.EMAIL_FROM as string,
    subject: `New contact form submission from ${escapeHtml(name)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 20px;">New contact form submission</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message)}</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
