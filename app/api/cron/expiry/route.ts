import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { expiryReminderEmailHtml } from "@/lib/email-templates";
import { revalidateUserCard } from "@/lib/revalidate-card";

const GRACE_PERIOD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret === secret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

function dayRange(daysFromNow: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysFromNow);
  const end = new Date(start.getTime() + DAY_MS);
  return { start, end };
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await db.siteContent.findUnique({
    where: { section_key: { section: "email_config", key: "expiryReminders" } },
  });

  const rules: { daysBeforeExpiry: number }[] = config ? JSON.parse(config.value) : [];

  const startOfToday = dayRange(0).start;
  let remindersSent = 0;

  for (const rule of rules) {
    const { start, end } = dayRange(rule.daysBeforeExpiry);

    const users = await db.user.findMany({
      where: { planExpiresAt: { gte: start, lt: end } },
      select: { id: true, email: true, name: true, planExpiresAt: true },
    });

    const emailType = `expiry_reminder_${rule.daysBeforeExpiry}`;

    for (const user of users) {
      if (!user.planExpiresAt) continue;

      try {
        const alreadySent = await db.emailLog.findFirst({
          where: { userId: user.id, type: emailType, sentAt: { gte: startOfToday } },
        });
        if (alreadySent) continue;

        await sendEmail({
          to: user.email,
          subject: `Your card expires in ${rule.daysBeforeExpiry} days`,
          html: expiryReminderEmailHtml({
            name: user.name,
            daysRemaining: rule.daysBeforeExpiry,
            planExpiresAt: user.planExpiresAt,
          }),
        });

        await db.emailLog.create({ data: { userId: user.id, type: emailType } });
        remindersSent += 1;
      } catch (err) {
        console.error(`expiry reminder failed for user ${user.id}`, err);
      }
    }
  }

  const graceRange = dayRange(-GRACE_PERIOD_DAYS);
  const graceExpiredUsers = await db.user.findMany({
    where: { planExpiresAt: { gte: graceRange.start, lt: graceRange.end } },
    select: { id: true },
  });

  let revalidated = 0;
  for (const user of graceExpiredUsers) {
    try {
      await revalidateUserCard(user.id);
      revalidated += 1;
    } catch (err) {
      console.error(`revalidate failed for user ${user.id}`, err);
    }
  }

  return NextResponse.json({ remindersSent, revalidated });
}
