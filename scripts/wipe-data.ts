/**
 * Deletes every user and all their data, keeping only the admin account
 * identified by ADMIN_EMAIL. Plans, site content and settings are preserved.
 *
 *   pnpm db:wipe            # dry run — prints what would be deleted
 *   pnpm db:wipe -- --yes   # actually delete
 */
import { db } from "../lib/db";

async function main() {
  const confirmed = process.argv.includes("--yes");
  const keeperEmail = process.env.ADMIN_EMAIL?.trim();

  if (!keeperEmail) {
    throw new Error("ADMIN_EMAIL is not set — refusing to wipe without a confirmed account to keep.");
  }

  const keeper = await db.user.findUnique({
    where: { email: keeperEmail },
    select: { id: true, email: true, role: true },
  });

  if (!keeper) {
    throw new Error(
      `No user found with ADMIN_EMAIL="${keeperEmail}" — refusing to wipe. Run \`prisma db seed\` first.`
    );
  }
  if (keeper.role !== "ADMIN") {
    throw new Error(`User "${keeperEmail}" has role ${keeper.role}, expected ADMIN — refusing to wipe.`);
  }

  const otherUsers = { userId: { not: keeper.id } };

  const [users, purchases, fields, gallery, views, referrals, wallet, emails, resets, audit] =
    await Promise.all([
      db.user.count({ where: { id: { not: keeper.id } } }),
      db.purchase.count(),
      db.cardField.count({ where: otherUsers }),
      db.galleryItem.count({ where: otherUsers }),
      db.cardView.count({ where: otherUsers }),
      db.referral.count(),
      db.walletTransaction.count({ where: otherUsers }),
      db.emailLog.count({ where: otherUsers }),
      db.passwordResetToken.count(),
      db.adminAuditLog.count(),
    ]);

  console.log(`Keeping: ${keeper.email} (${keeper.role})`);
  console.table({
    users,
    purchases,
    cardFields: fields,
    galleryItems: gallery,
    cardViews: views,
    referrals,
    walletTransactions: wallet,
    emailLogs: emails,
    passwordResetTokens: resets,
    adminAuditLogs: audit,
  });
  console.log("Preserved: Plan, SiteContent, Settings, and the keeper's own card data.");

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to delete.");
    return;
  }

  // Ordered child-first so foreign keys never block a delete.
  await db.$transaction([
    db.cardView.deleteMany({ where: otherUsers }),
    db.walletTransaction.deleteMany({ where: otherUsers }),
    db.emailLog.deleteMany({ where: otherUsers }),
    db.passwordResetToken.deleteMany({}),
    db.referral.deleteMany({}),
    db.purchase.deleteMany({}),
    db.galleryItem.deleteMany({ where: otherUsers }),
    db.cardField.deleteMany({ where: otherUsers }),
    db.cardSettings.deleteMany({ where: otherUsers }),
    db.user.deleteMany({ where: { id: { not: keeper.id } } }),
    db.adminAuditLog.deleteMany({}),
    // The keeper kept its card, but any plan it held is gone with the purchases.
    db.user.update({
      where: { id: keeper.id },
      data: { planId: null, planExpiresAt: null, walletPoints: 0 },
    }),
  ]);

  console.log("\nDone. Database wiped except for the admin account.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
