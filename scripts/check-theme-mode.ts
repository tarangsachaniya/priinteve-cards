import { db } from "@/lib/db";

/**
 * Dev helper for verifying the card theme system.
 *
 *   npx tsx scripts/check-theme-mode.ts                 # report current state
 *   npx tsx scripts/check-theme-mode.ts bento dark      # set theme + mode
 */
async function main() {
  const [themeArg, modeArg] = process.argv.slice(2);

  const user = await db.user.findFirst({
    where: { cardPublished: true },
    include: { cardSettings: true, cardFields: { orderBy: { order: "asc" } }, galleryItems: true },
  });

  if (!user) {
    console.log("No published card found.");
    return;
  }

  if (themeArg || modeArg) {
    const updated = await db.cardSettings.update({
      where: { userId: user.id },
      data: {
        ...(themeArg && { themeId: themeArg }),
        ...(modeArg && { themeMode: modeArg }),
      },
    });
    console.log(`set themeId=${updated.themeId} themeMode=${updated.themeMode}`);
    return;
  }

  console.log("slug:", user.slug);
  console.log("settings:", {
    themeId: user.cardSettings?.themeId,
    themeMode: user.cardSettings?.themeMode,
    brandColor: user.cardSettings?.brandColor,
    headingFont: user.cardSettings?.headingFont,
    bodyFont: user.cardSettings?.bodyFont,
  });
  console.log("gallery items:", user.galleryItems.length, user.galleryItems.map((g) => g.type));
  console.log("fields:");
  for (const field of user.cardFields) {
    const preview = field.value.length > 48 ? `${field.value.slice(0, 48)}…` : field.value;
    console.log(`  ${String(field.order).padStart(3)}  ${field.fieldType.padEnd(22)} ${field.isVisible ? " " : "H"} ${preview}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
